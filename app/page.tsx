import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Linear Public Portal
          </h1>
          <p className="text-xl text-gray-600">
            Share Linear projects and roadmaps with internal stakeholders
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/report"
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-bold mb-2">Report an Issue</h2>
            <p className="text-gray-600">
              Use our chatbot to report issues, request features, or get help from the RevOps team.
            </p>
          </Link>

          <Link
            href="/admin"
            className="block p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow"
          >
            <h2 className="text-2xl font-bold mb-2">Manage Boards</h2>
            <p className="text-gray-600">
              Create and configure board views. Set up row/column grouping and project selection.
            </p>
          </Link>
        </div>
      </div>
    </div>
  )
}
