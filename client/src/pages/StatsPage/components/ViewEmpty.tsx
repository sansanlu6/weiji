import { Inbox } from 'lucide-react';

interface ViewEmptyProps {
  text: string;
}

const ViewEmpty: React.FC<ViewEmptyProps> = ({ text }) => (
  <div className="paper-card p-12 flex flex-col items-center text-center">
    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-3">
      <Inbox className="w-8 h-8 text-muted-foreground/50" strokeWidth={1.3} />
    </div>
    <p className="text-sm text-muted-foreground">{text}</p>
  </div>
);

export default ViewEmpty;
