"use server";

import { revalidatePath } from "next/cache";

export async function uploadDocument(
  prevState: {
    success: boolean;
    message: string;
  },
  formData: FormData,
) {
  try {
    const file = formData.get("file") as File;

    if (!file) {
      return {
        success: false,
        message: "Vui long chon file PDF",
      };
    }

    if (file.type !== "application/pdf") {
      return {
        success: false,
        message: "Chi ho tro file PDF",
      };
    }

    const payload = new FormData();
    payload.append("file", file);
    payload.append("fileName", file.name);

    const response = await fetch(process.env.N8N_WEBHOOK_UPLOAD_FILE_URL!, {
      method: "POST",
      body: payload,
    });

    if (!response.ok) {
      return {
        success: false,
        message: "Khong the gui file den n8n",
      };
    }

    revalidatePath("/dashboard/kb");

    return {
      success: true,
      message: "Da gui tai lieu sang he thong RAG de chunk va tao embedding",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Co loi xay ra khi upload",
    };
  }
}
