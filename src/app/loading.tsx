export default function Loading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="animate-pulse space-y-4">
        <div className="h-10 rounded-md bg-gray-200" />
        <div className="h-40 rounded-md bg-gray-200" />
        <div className="h-20 rounded-md bg-gray-200" />
      </div>
    </div>
  );
}
