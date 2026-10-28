import { useCallback, useEffect, useRef, useState } from 'react';
import ConfirmDialog from './ConfirmDialog';

export default function useUnsavedChangesGuard(isDirty) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const closeActionRef = useRef(null);

  useEffect(() => {
    if (!isDirty) return undefined;
    const warnBeforeUnload = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeUnload);
    return () => window.removeEventListener('beforeunload', warnBeforeUnload);
  }, [isDirty]);

  const requestClose = useCallback((closeAction) => {
    if (!isDirty) {
      closeAction();
      return;
    }
    closeActionRef.current = closeAction;
    setIsConfirmOpen(true);
  }, [isDirty]);

  const discardChanges = useCallback(() => {
    const closeAction = closeActionRef.current;
    closeActionRef.current = null;
    setIsConfirmOpen(false);
    closeAction?.();
  }, []);

  const keepEditing = useCallback(() => {
    closeActionRef.current = null;
    setIsConfirmOpen(false);
  }, []);

  const dialog = (
    <ConfirmDialog
      isOpen={isConfirmOpen}
      title="Unsaved Changes"
      message="Your changes have not been saved. Continue editing to save them, or leave without saving."
      onConfirm={discardChanges}
      onCancel={keepEditing}
      confirmText="Leave Without Saving"
      cancelText="Continue Editing"
      isDanger
    />
  );

  return { requestClose, dialog };
}
