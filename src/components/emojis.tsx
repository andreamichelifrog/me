import { Button } from "./ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useUser } from "@/lib/UserContext";

export default function Emojis() {
  const { user } = useUser();

  const icons = ["😂", "♥️", "😭", "👍", "🙏", "🎉"];

  async function sendEmoji(emoji: string, userId: string) {
    const { error } = await supabase.from("emoji_reactions").insert([
      {
        emoji: emoji,
        user_id: userId,
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.error("Error sending emoji:", error.message);
    } else {
      console.log("Emoji sent successfully!");
    }
  }

  return (
    <div className="w-64 mx-auto grid grid-cols-3 gap-4 place-items-center">
      {icons.map((icon, index) => (
        <Button
          className="rounded-3xl w-20 h-20 text-3xl md:w-24 md:h-24 p-2"
          size="icon-lg"
          key={index}
          variant="three-d"
          aria-label="Submit"
          onClick={() => sendEmoji(icon, user!.id)}
        >
          {icon}
        </Button>
      ))}
    </div>
  );
}
