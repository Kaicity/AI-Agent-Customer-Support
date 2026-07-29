import UploadForm from "./upload-form";

export default function KnowledgeBasePage() {
  return (
    <div className="max-w-3xl">
      <h1 className="text-xl font-medium mb-2">Tài liệu hệ thống</h1>
      <p className="text-sm text-gray-500 mb-6">
        Upload file PDF để đưa vào hệ thống tri thức.
      </p>
      <UploadForm />
    </div>
  );
}
