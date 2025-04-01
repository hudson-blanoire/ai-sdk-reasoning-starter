import Link from 'next/link';

export function Footnote() {
  return (
    <div className="text-xs text-zinc-400 leading-5 hidden sm:block">
      Atoma is built using{' '}
      <Link
        className="underline underline-offset-2"
        href="https://nextjs.org/"
        target="_blank"
      >
        Next.js
      </Link>{' '}
      and powered by advanced language models.
    </div>
  );
}
