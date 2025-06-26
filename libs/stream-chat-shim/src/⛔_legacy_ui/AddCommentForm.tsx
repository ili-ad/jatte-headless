import React from 'react';

export type AddCommentFormProps = {
  close: () => void;
  messageId: string;
};

/** Placeholder implementation of the AddCommentForm component. */
export const AddCommentForm = (_props: AddCommentFormProps) => {
  return <div className="add-comment-form-placeholder">AddCommentForm</div>;
};

export default AddCommentForm;
