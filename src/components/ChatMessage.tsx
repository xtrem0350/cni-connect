type ChatMessageProps = {
  sender: "me" | "them";
  text: string;
  time?: string;
};

export function ChatMessage({ sender, text, time = "Maintenant" }: ChatMessageProps) {
  const isMe = sender === "me";

  return (
    <div className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
          isMe ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
        }`}
      >
        <p>{text}</p>
        <p className={`mt-1 text-[10px] ${isMe ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
          {time}
        </p>
      </div>
    </div>
  );
}
