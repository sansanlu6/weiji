import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
  DialogOverlay,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';

interface ValidationAlertProps {
  open: boolean;
  message: string;
  onClose: () => void;
}

const ValidationAlert: React.FC<ValidationAlertProps> = ({ open, message, onClose }) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogOverlay
        style={{
          backgroundColor: 'rgba(30, 45, 38, 0.22)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
        }}
      />
      <DialogContent
        className="max-w-[80%] sm:max-w-[320px] p-0 rounded-[20px]"
        style={{
          background: '#ffffff',
          boxShadow: '0 16px 40px rgba(42, 72, 58, 0.12)',
          border: '1px solid rgba(255, 255, 255, 0.6)',
        }}
        showCloseButton={false}
      >
        <div style={{ padding: '28px 24px 20px 24px', textAlign: 'center' }}>
          <DialogTitle
            className="text-lg font-semibold font-sans-hei"
            style={{ color: '#2A483A' }}
          >
            提示
          </DialogTitle>
          <p
            className="text-sm mt-3 font-sans-hei"
            style={{ color: '#6B7A72', lineHeight: '1.6' }}
          >
            {message}
          </p>
        </div>
        <DialogFooter className="px-6 pb-6 flex flex-col items-center">
          <Button
            type="button"
            onClick={onClose}
            className="w-full rounded-full font-sans-hei font-semibold"
            style={{
              height: '44px',
              backgroundColor: '#fef3c7',
              color: '#6b5a3e',
              boxShadow: '0 4px 14px rgba(214, 178, 76, 0.18)',
              fontSize: '15px',
              border: '1px solid rgba(245, 215, 110, 0.4)',
            }}
          >
            我知道了
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ValidationAlert;
