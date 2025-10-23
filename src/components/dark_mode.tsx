import { useTheme } from '@/lib/ThemeContext';
import { Label } from '@radix-ui/react-label';
import { Button } from './ui/button';
import { useUser } from '@/lib/UserContext';

export default function DarkMode() {
  const { user } = useUser();
  const { isDark, toggleTheme } = useTheme();

  return (
    <Button
      className="rounded-3xl h-20 text-3xl md:h-24 w-64 flex justify-between"
      size="lg"
      variant="three-d"
      aria-label="Toggle dark mode"
      onClick={() => toggleTheme(user?.id)}
    >
      <div className='flex items-center gap-4'>
        <p>{isDark ? '🌙' : '☀️'}</p>
        <input type="checkbox" value="" className="sr-only peer" checked={isDark} readOnly />
        <div className="relative w-11 h-6 bg-secondary rounded-full peer peer-focus:ring-4 peer-focus:ring-ring peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-background after:content-[''] after:absolute after:top-0.5 after:start-[2px] after:bg-background after:border-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
      </div>
      <Label htmlFor="dark-mode" className='text-xl'>Dark Mode</Label>
    </Button>
  );
}
