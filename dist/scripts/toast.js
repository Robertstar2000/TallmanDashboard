import { toast } from 'sonner';
export const showSuccess = (title, description) => {
    toast.success(title, {
        description,
    });
};
export const showError = (title, description) => {
    toast.error(title, {
        description,
    });
};
export const showLoading = (title, description) => {
    toast.loading(title, {
        description,
    });
};
