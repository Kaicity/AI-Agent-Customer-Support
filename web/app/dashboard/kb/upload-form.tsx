"use client";

import { useFormState, useFormStatus } from "react-dom";
import { uploadDocument } from "./actions";

export default function UploadForm() {
  const initialState = {
    success: false,
    message: "",
  };

  const [state, formAction] = useFormState(uploadDocument, initialState);
  const { pending } = useFormStatus();

  return (
    <form
      action={formAction}
      className="bg-white rounded-xl border border-gray-200 p-5 space-y-4"
    >
      <div>
        <label className="block text-sm font-medium mb-2">
          Tải lên file PDF
        </label>

        <input
          type="file"
          name="file"
          accept=".pdf"
          required
          className="block w-full text-sm"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-black text-white px-4 py-2 text-sm"
      >
        {pending ? "Dang upload..." : "Upload PDF"}
      </button>

      {state.message && (
        <div
          className={`text-sm ${
            state.success ? "text-green-600" : "text-red-600"
          }`}
        >
          {state.message}
        </div>
      )}
    </form>
  );
}
