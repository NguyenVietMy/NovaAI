import React from "react";

export default function UserAnalyticsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-gray-900">
          User Analytics
        </h1>
        {/* Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-2xl font-semibold text-blue-600">1,234</span>
            <span className="text-gray-500 mt-2">Total Users</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-2xl font-semibold text-green-600">87</span>
            <span className="text-gray-500 mt-2">Active Today</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-2xl font-semibold text-yellow-600">320</span>
            <span className="text-gray-500 mt-2">New This Month</span>
          </div>
          <div className="bg-white rounded-xl shadow p-6 flex flex-col items-center">
            <span className="text-2xl font-semibold text-red-600">12%</span>
            <span className="text-gray-500 mt-2">Churn Rate</span>
          </div>
        </div>
        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              User Growth
            </h2>
            <div className="h-64 flex items-center justify-center text-gray-400">
              {/* Chart Placeholder */}
              <span className="italic">[User Growth Chart]</span>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Active Users
            </h2>
            <div className="h-64 flex items-center justify-center text-gray-400">
              {/* Chart Placeholder */}
              <span className="italic">[Active Users Chart]</span>
            </div>
          </div>
        </div>
        {/* Table Section */}
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Recent Signups
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Signup Date
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i}>
                    <td className="px-4 py-2 whitespace-nowrap font-medium text-gray-800">
                      User {i}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-600">
                      user{i}@example.com
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-gray-500">
                      2024-06-01
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <span className="inline-block px-2 py-1 rounded bg-green-100 text-green-700 text-xs font-semibold">
                        Active
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
