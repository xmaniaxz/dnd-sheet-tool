import './character.css';
import { ThemeProvider } from '@/context/ThemeContext';

export default function CharacterLayout({ children }: { children: React.ReactNode }) {
  return <ThemeProvider>{children}</ThemeProvider>;
}
