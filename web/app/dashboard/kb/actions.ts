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
        message: "Vui lòng chọn file PDF",
      };
    }

    if (file.type !== "application/pdf") {
      return {
        success: false,
        message: "Chỉ hỗ trợ file PDF",
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
        message: "Không thể gửi file đến hệ thống",
      };
    }

    revalidatePath("/dashboard/kb");

    return {
      success: true,
      message: "Đã gửi tài liệu thành công",
    };
  } catch (error) {
    console.error(error);

    return {
      success: false,
      message: "Có lỗi xảy ra khi Upload",
    };
  }
}
