"use client";

import { useEffect, useState } from "react";
import AdminNav from "@/components/AdminNav";
import { Users, Search, Edit2, Trash2, Save, X, GraduationCap } from "lucide-react";

type Student = {
  id: string;
  name: string;
  age: number;
  grade: number;
  medium: string;
  school: string;
  email: string | null;
  phone: string | null;
};

const GRADES = [6, 7, 8, 9, 10, 11];

export default function AdminStudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Student>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterGrade, setFilterGrade] = useState<number | "all">("all");

  function load() {
    fetch("/api/admin/students").then((r) => r.json()).then((data) => {
      setStudents(data);
      setFilteredStudents(data);
    });
  }

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let filtered = students;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.school.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.phone?.includes(searchQuery)
      );
    }

    // Filter by grade
    if (filterGrade !== "all") {
      filtered = filtered.filter((s) => s.grade === filterGrade);
    }

    setFilteredStudents(filtered);
  }, [searchQuery, filterGrade, students]);

  async function remove(id: string) {
    if (!confirm("Remove this student? This cannot be undone.")) return;
    await fetch("/api/admin/students", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    load();
  }

  function startEdit(s: Student) {
    setEditingId(s.id);
    setDraft(s);
  }

  async function saveEdit() {
    await fetch("/api/admin/students", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    setEditingId(null);
    load();
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft({});
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <AdminNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <div className="mb-8 animate-slide-in-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
              <p className="text-gray-600">{students.length} registered students</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="card shadow-xl border-2 border-gray-200 mb-6 animate-fade-in">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                className="input pl-10"
                placeholder="Search by name, school, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Grade Filter */}
            <select
              className="input"
              value={filterGrade}
              onChange={(e) => setFilterGrade(e.target.value === "all" ? "all" : Number(e.target.value))}
            >
              <option value="all">All Grades</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  Grade {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Students Table */}
        <div className="card shadow-xl border-2 border-gray-200 overflow-hidden animate-fade-in" style={{ animationDelay: "0.1s" }}>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-16">
              <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium mb-2">No students found</p>
              <p className="text-gray-500 text-sm">
                {searchQuery || filterGrade !== "all"
                  ? "Try adjusting your filters"
                  : "Students will appear here once they register"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-gray-100 to-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Student</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Age</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Grade</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Medium</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">School</th>
                    <th className="text-left p-4 font-semibold text-gray-700 text-sm">Contact</th>
                    <th className="text-right p-4 font-semibold text-gray-700 text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredStudents.map((s, index) =>
                    editingId === s.id ? (
                      <tr key={s.id} className="bg-blue-50 animate-scale-in">
                        <td className="p-3">
                          <input
                            className="input text-sm"
                            value={draft.name || ""}
                            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            type="number"
                            className="input text-sm w-20"
                            value={draft.age ?? ""}
                            onChange={(e) => setDraft((d) => ({ ...d, age: Number(e.target.value) }))}
                          />
                        </td>
                        <td className="p-3">
                          <select
                            className="input text-sm w-24"
                            value={draft.grade}
                            onChange={(e) => setDraft((d) => ({ ...d, grade: Number(e.target.value) }))}
                          >
                            {GRADES.map((g) => (
                              <option key={g} value={g}>
                                {g}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3">
                          <select
                            className="input text-sm"
                            value={draft.medium}
                            onChange={(e) => setDraft((d) => ({ ...d, medium: e.target.value as any }))}
                          >
                            <option value="ENGLISH">English</option>
                            <option value="SINHALA">Sinhala</option>
                          </select>
                        </td>
                        <td className="p-3">
                          <input
                            className="input text-sm"
                            value={draft.school || ""}
                            onChange={(e) => setDraft((d) => ({ ...d, school: e.target.value }))}
                          />
                        </td>
                        <td className="p-3">
                          <input
                            className="input text-sm"
                            value={draft.email || draft.phone || ""}
                            onChange={(e) =>
                              setDraft((d) => (d.email ? { ...d, email: e.target.value } : { ...d, phone: e.target.value }))
                            }
                          />
                        </td>
                        <td className="p-3 text-right space-x-2">
                          <button
                            onClick={saveEdit}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition text-sm font-medium"
                          >
                            <Save className="w-4 h-4" />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition text-sm font-medium"
                          >
                            <X className="w-4 h-4" />
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ) : (
                      <tr key={s.id} className="hover:bg-gray-50 transition stagger-item">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center">
                              <GraduationCap className="w-5 h-5 text-white" />
                            </div>
                            <span className="font-medium text-gray-900">{s.name}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-700">{s.age}</td>
                        <td className="p-4">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold">
                            Grade {s.grade}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-lg text-xs font-semibold ${s.medium === "SINHALA" ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700"
                            }`}>
                            {s.medium}
                          </span>
                        </td>
                        <td className="p-4 text-gray-700 text-sm">{s.school}</td>
                        <td className="p-4 text-gray-600 text-sm">{s.email || s.phone}</td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => startEdit(s)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition text-sm font-medium"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => remove(s.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
