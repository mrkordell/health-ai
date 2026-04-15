import ReactMarkdown from 'react-markdown';

interface CoachMessageProps {
  content: string;
}

export function CoachMessage({ content }: CoachMessageProps) {
  return (
    <div className="flex justify-start gap-2">
      {/* Avatar placeholder */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center">
        <span className="text-brand-600 text-sm font-medium">V</span>
      </div>
      <div className="max-w-[80%] px-4 py-2 rounded-2xl rounded-bl-md bg-neutral-200 text-neutral-900">
        <div className="text-sm prose prose-sm prose-neutral max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      </div>
    </div>
  );
}
