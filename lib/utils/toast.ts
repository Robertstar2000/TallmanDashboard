import { toast } from 'sonner';

export const showSuccess = (title: string, description?: string) => {
  toast.success(title, {
    description,
  });
};

export const showError = (title: string, description?: string) => {
  toast.error(title, {
    description,
  });
};

export const showLoading = (title: string, description?: string) => {
  toast.loading(title, {
    description,
  });
};