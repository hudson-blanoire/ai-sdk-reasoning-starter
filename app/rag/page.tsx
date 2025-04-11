import { RagChat } from '@/components/rag-chat';

export const metadata = {
  title: 'RAG Chat | Atoma',
  description: 'Retrieval-Augmented Generation (RAG) enabled chat interface'
};

export default function RagPage() {
  return (
    <main className="flex flex-col flex-1 w-full">
      <div className="flex-1">
        <RagChat />
      </div>
    </main>
  );
}
