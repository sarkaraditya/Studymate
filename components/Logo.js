import Link from 'next/link';
import Icon from './Icon';
export default function Logo() {
  return <Link className="logo" href="/"><Icon n="book" />StudyMate AI</Link>;
}
