import Swal from 'sweetalert2';

export const showLoadingToast = (msg: string) =>
    Swal.fire({
        title: msg,
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        didOpen: () => {
            Swal.showLoading();
        },
    });