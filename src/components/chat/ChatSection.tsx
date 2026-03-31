import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/i18n/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Send, MessageCircle, ArrowLeft, Check, CheckCheck, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface Contact {
  id: string;
  display_name: string;
  avatar_url: string | null;
  unread: number;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  read: boolean;
  created_at: string;
}

const ChatSection = () => {
  const { user, role } = useAuth();
  const { isRTL, language } = useLanguage();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFallbackName = useCallback(() => (isRTL ? "مستخدم" : "User"), [isRTL]);

  const scrollToBottom = useCallback(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, []);

  const loadContacts = useCallback(async () => {
    if (!user || !role) return;

    setLoadingContacts(true);
    const { data, error } = await (supabase as any).rpc("get_chat_contacts");

    if (error) {
      setContacts([]);
      setLoadingContacts(false);
      return;
    }

    const nextContacts: Contact[] = (data || []).map((contact: any) => ({
      id: contact.user_id,
      display_name: contact.display_name || getFallbackName(),
      avatar_url: contact.avatar_url,
      unread: Number(contact.unread_count || 0),
    }));

    setContacts(nextContacts);
    setSelectedContact((prev) => {
      if (!prev) return null;
      return nextContacts.find((contact) => contact.id === prev.id) ?? prev;
    });
    setLoadingContacts(false);
  }, [getFallbackName, role, user]);

  const markConversationAsRead = useCallback(async (contactId: string) => {
    if (!user || role === "super_admin") return;

    await supabase
      .from("messages")
      .update({ read: true })
      .eq("sender_id", contactId)
      .eq("receiver_id", user.id)
      .eq("read", false);

    setContacts((prev) => prev.map((contact) => (
      contact.id === contactId ? { ...contact, unread: 0 } : contact
    )));
  }, [role, user]);

  const loadMessages = useCallback(async (contactId: string) => {
    if (!user || !role) return;

    setLoadingMessages(true);

    const query = role === "super_admin"
      ? supabase
          .from("messages")
          .select("*")
          .or(`sender_id.eq.${contactId},receiver_id.eq.${contactId}`)
      : supabase
          .from("messages")
          .select("*")
          .or(`and(sender_id.eq.${user.id},receiver_id.eq.${contactId}),and(sender_id.eq.${contactId},receiver_id.eq.${user.id})`);

    const { data } = await query.order("created_at", { ascending: true });

    setMessages(data || []);
    setLoadingMessages(false);

    if (role !== "super_admin") {
      await markConversationAsRead(contactId);
    }

    setTimeout(scrollToBottom, 100);
  }, [markConversationAsRead, role, scrollToBottom, user]);

  useEffect(() => {
    loadContacts();
  }, [loadContacts]);

  useEffect(() => {
    if (!selectedContact?.id) return;
    loadMessages(selectedContact.id);
  }, [loadMessages, selectedContact?.id]);

  useEffect(() => {
    if (!user || !role) return;

    const channel = supabase
      .channel(`messages-realtime-${user.id}-${role}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        async (payload) => {
          const message = payload.new as Message;
          const isRelevant = role === "super_admin"
            ? true
            : message.sender_id === user.id || message.receiver_id === user.id;

          if (!isRelevant) return;

          const isOpenConversation = selectedContact
            ? role === "super_admin"
              ? message.sender_id === selectedContact.id || message.receiver_id === selectedContact.id
              : (
                  (message.sender_id === selectedContact.id && message.receiver_id === user.id) ||
                  (message.sender_id === user.id && message.receiver_id === selectedContact.id)
                )
            : false;

          if (isOpenConversation) {
            setMessages((prev) => prev.some((item) => item.id === message.id) ? prev : [...prev, message]);
            setTimeout(scrollToBottom, 50);

            if (role !== "super_admin" && message.receiver_id === user.id && message.sender_id === selectedContact?.id) {
              await supabase.from("messages").update({ read: true }).eq("id", message.id);
              setContacts((prev) => prev.map((contact) => (
                contact.id === selectedContact.id ? { ...contact, unread: 0 } : contact
              )));
            }
            return;
          }

          if (role === "super_admin") {
            loadContacts();
            return;
          }

          if (message.receiver_id === user.id) {
            setContacts((prev) => {
              const existing = prev.find((contact) => contact.id === message.sender_id);
              if (!existing) {
                void loadContacts();
                return prev;
              }

              return prev.map((contact) => (
                contact.id === message.sender_id
                  ? { ...contact, unread: contact.unread + 1 }
                  : contact
              ));
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        (payload) => {
          const message = payload.new as Message;
          setMessages((prev) => prev.map((item) => (item.id === message.id ? message : item)));

          if (message.receiver_id === user.id && message.read) {
            setContacts((prev) => prev.map((contact) => (
              contact.id === message.sender_id ? { ...contact, unread: 0 } : contact
            )));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [loadContacts, role, scrollToBottom, selectedContact, user]);

  const handleSend = async () => {
    if (!newMessage.trim() || !selectedContact || !user || sending || role === "super_admin") return;

    setSending(true);
    const { error } = await supabase.from("messages").insert({
      sender_id: user.id,
      receiver_id: selectedContact.id,
      content: newMessage.trim(),
    });

    if (!error) {
      setNewMessage("");
      inputRef.current?.focus();
    }

    setSending(false);
  };

  const formatTime = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();

    if (isToday) {
      return d.toLocaleTimeString(language === "ar" ? "ar-EG" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
      });
    }

    return d.toLocaleDateString(language === "ar" ? "ar-EG" : "en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const emptyMessage = role === "doctor"
    ? (isRTL ? "لا يوجد مرضى مربوطين بحسابات بعد. أضف المريض بالإيميل أو الاسم أو الـ ID أولاً." : "No linked patients yet. Add a patient by email, name, or user ID first.")
    : role === "patient"
      ? (isRTL ? "لم يتم ربطك بطبيب بعد. تواصل مع طبيبك لربط الحساب." : "You're not linked to a doctor yet. Ask your doctor to link your account.")
      : (isRTL ? "لا توجد محادثات بعد." : "No conversations yet.");

  const renderContactList = () => (
    <Card className="h-[calc(100vh-12rem)]">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          {role === "super_admin" ? <Shield className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
          {isRTL ? "الرسائل" : "Messages"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loadingContacts ? (
          <div className="space-y-2 p-4">
            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-16 w-full" />)}
          </div>
        ) : contacts.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">{emptyMessage}</div>
        ) : (
          <div className="divide-y">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setSelectedContact(contact)}
                className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-muted"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {contact.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{contact.display_name}</p>
                  {role === "super_admin" && (
                    <p className="truncate text-xs text-muted-foreground">
                      {isRTL ? "عرض رسائل هذا المستخدم" : "View this user's messages"}
                    </p>
                  )}
                </div>
                {contact.unread > 0 && (
                  <Badge className="bg-primary text-primary-foreground">{contact.unread}</Badge>
                )}
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderChat = () => (
    <Card className="flex h-[calc(100vh-12rem)] flex-col">
      <CardHeader className="flex-row items-center gap-3 border-b pb-3">
        <Button variant="ghost" size="icon" onClick={() => setSelectedContact(null)} className="shrink-0 md:hidden">
          <ArrowLeft className={cn("h-4 w-4", isRTL && "rotate-180")} />
        </Button>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
          {selectedContact?.display_name.charAt(0).toUpperCase()}
        </div>
        <div className="min-w-0">
          <CardTitle className="truncate text-base">{selectedContact?.display_name}</CardTitle>
          {role === "super_admin" && (
            <p className="text-xs text-muted-foreground">
              {isRTL ? "عرض إداري فقط للمحادثات" : "Read-only admin message view"}
            </p>
          )}
        </div>
      </CardHeader>

      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
        {loadingMessages ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => <Skeleton key={item} className="h-10 w-2/3" />)}
          </div>
        ) : messages.length === 0 ? (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            {isRTL ? "لا توجد رسائل بعد..." : "No messages yet..."}
          </div>
        ) : (
          messages.map((message) => {
            const isMine = role === "super_admin"
              ? message.receiver_id !== selectedContact?.id
              : message.sender_id === user?.id;

            const senderLabel = role === "super_admin"
              ? message.sender_id === selectedContact?.id
                ? selectedContact?.display_name
                : (isRTL ? "الطرف الآخر" : "Other participant")
              : null;

            return (
              <div key={message.id} className={cn("flex", isMine ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                    isMine
                      ? "bg-primary text-primary-foreground rounded-br-sm"
                      : "bg-muted text-foreground rounded-bl-sm"
                  )}
                >
                  {senderLabel && (
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide opacity-70">{senderLabel}</p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{message.content}</p>
                  <div className={cn(
                    "mt-1 flex items-center gap-1 text-[10px] opacity-70",
                    isMine ? "justify-end" : "justify-start"
                  )}>
                    <span>{formatTime(message.created_at)}</span>
                    {role !== "super_admin" && isMine && (
                      message.read
                        ? <CheckCheck className="h-3 w-3" />
                        : <Check className="h-3 w-3" />
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {role !== "super_admin" && (
        <div className="border-t p-3">
          <form onSubmit={(event) => { event.preventDefault(); handleSend(); }} className="flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newMessage}
              onChange={(event) => setNewMessage(event.target.value)}
              placeholder={isRTL ? "اكتب رسالة..." : "Type a message..."}
              className="flex-1"
              disabled={sending}
            />
            <Button type="submit" size="icon" disabled={!newMessage.trim() || sending}>
              <Send className={cn("h-4 w-4", isRTL && "rotate-180")} />
            </Button>
          </form>
        </div>
      )}
    </Card>
  );

  return (
    <div className="grid h-full md:grid-cols-[300px_1fr]">
      <div className={cn("h-full", selectedContact && "hidden md:block")}>
        {renderContactList()}
      </div>
      <div className={cn("h-full", !selectedContact && "hidden md:block")}>
        {selectedContact ? renderChat() : (
          <Card className="hidden h-[calc(100vh-12rem)] items-center justify-center md:flex">
            <div className="text-center">
              <MessageCircle className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">{isRTL ? "اختر محادثة لبدء الدردشة" : "Select a conversation to start chatting"}</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChatSection;
