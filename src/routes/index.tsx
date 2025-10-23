import { createFileRoute } from '@tanstack/react-router'
import EmojiFloatLayer from '@/components/emoji_float_layer'
import DrawingOverlay from '@/components/drawing_overlay'

function Index() {
  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <DrawingOverlay></DrawingOverlay>
      <EmojiFloatLayer></EmojiFloatLayer>
    </div>
  )
}

export const Route = createFileRoute('/')({
  component: Index,
})



