import { createFileRoute } from '@tanstack/react-router'
import EmojiFloatLayer from '@/components/emoji_float_layer'

function Index() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <EmojiFloatLayer></EmojiFloatLayer>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Index,
})



