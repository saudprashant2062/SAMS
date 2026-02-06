import { useMemo } from "react";

/* ============================================================
   CascadingFilters Component
   Reusable component for Department → Batch → Semester → Section
   
   Usage:
   <CascadingFilters
     value={filters}
     onChange={setFilters}
     departments={departments}
     batches={batches}
     semesters={semesters}
     sections={sections}
     showSection={true}
   />
============================================================ */

const CascadingFilters = ({
  value,
  onChange,
  departments = [],
  batches = [],
  semesters = [],
  sections = [],
  showSection = true,
  showLabels = true,
  required = {
    department: true,
    batch: true,
    semester: true,
    section: false,
  },
  placeholders = {
    department: "Select Department",
    batch: "Select Batch",
    semester: "Select Semester",
    section: "All Sections",
  },
  className = "",
}) => {
  // Filter options based on parent selection
  const filteredBatches = useMemo(() => {
    if (!value.department_id) return batches;
    return batches.filter((b) => b.department_id === value.department_id);
  }, [batches, value.department_id]);

  const filteredSemesters = useMemo(() => {
    if (!value.department_id) return semesters;
    return semesters.filter((s) => s.department_id === value.department_id);
  }, [semesters, value.department_id]);

  const filteredSections = useMemo(() => {
    if (!value.batch_id || !value.semester_id) return [];
    return sections.filter(
      (s) =>
        s.batch_id === value.batch_id &&
        s.semester_id === value.semester_id &&
        !s.is_archived,
    );
  }, [sections, value.batch_id, value.semester_id]);

  // Handlers
  const handleDepartmentChange = (e) => {
    const deptId = e.target.value;
    onChange({
      ...value,
      department_id: deptId,
      batch_id: "",
      semester_id: "",
      section_id: "",
    });
  };

  const handleBatchChange = (e) => {
    const batchId = e.target.value;
    onChange({
      ...value,
      batch_id: batchId,
      semester_id: "",
      section_id: "",
    });
  };

  const handleSemesterChange = (e) => {
    const semId = e.target.value;
    onChange({
      ...value,
      semester_id: semId,
      section_id: "",
    });
  };

  const handleSectionChange = (e) => {
    onChange({
      ...value,
      section_id: e.target.value,
    });
  };

  const handleClearAll = () => {
    onChange({
      department_id: "",
      batch_id: "",
      semester_id: "",
      section_id: "",
    });
  };

  // Check if any filter is active
  const hasActiveFilters =
    value.department_id ||
    value.batch_id ||
    value.semester_id ||
    value.section_id;

  // Check if dropdowns should be disabled
  const canSelectBatch = !!value.department_id;
  const canSelectSemester = !!value.department_id;
  const canSelectSection = !!value.batch_id && !!value.semester_id;

  return (
    <div className={`cascading-filters ${className}`}>
      <div className="filter-row flex flex-wrap gap-4 items-end">
        {/* Department Dropdown */}
        <div className="filter-item">
          {showLabels && (
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Department{" "}
              {required.department && <span className="text-danger">*</span>}
            </label>
          )}
          <select
            value={value.department_id}
            onChange={handleDepartmentChange}
            className="px-3 py-2 rounded-lg text-sm outline-none min-w-40"
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">{placeholders.department}</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Batch Dropdown */}
        <div className="filter-item">
          {showLabels && (
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Batch {required.batch && <span className="text-danger">*</span>}
            </label>
          )}
          <select
            value={value.batch_id}
            onChange={handleBatchChange}
            disabled={!canSelectBatch}
            className="px-3 py-2 rounded-lg text-sm outline-none min-w-45 disabled:opacity-50"
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">
              {canSelectBatch ? placeholders.batch : "Select Dept First"}
            </option>
            {filteredBatches.map((batch) => (
              <option key={batch.id} value={batch.id}>
                {batch.start_year} Batch {batch.name ? `- ${batch.name}` : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Semester Dropdown */}
        <div className="filter-item">
          {showLabels && (
            <label
              className="block text-xs font-medium mb-1"
              style={{ color: "var(--text-secondary)" }}
            >
              Semester{" "}
              {required.semester && <span className="text-danger">*</span>}
            </label>
          )}
          <select
            value={value.semester_id}
            onChange={handleSemesterChange}
            disabled={!canSelectSemester}
            className="px-3 py-2 rounded-lg text-sm outline-none min-w-40 disabled:opacity-50"
            style={{
              backgroundColor: "var(--bg-main)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
          >
            <option value="">
              {canSelectSemester ? placeholders.semester : "Select Dept First"}
            </option>
            {filteredSemesters
              .sort((a, b) => a.number - b.number)
              .map((sem) => (
                <option key={sem.id} value={sem.id}>
                  Semester {sem.number} {sem.name ? `- ${sem.name}` : ""}
                </option>
              ))}
          </select>
        </div>

        {/* Section Dropdown (Optional) */}
        {showSection && (
          <div className="filter-item">
            {showLabels && (
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: "var(--text-secondary)" }}
              >
                Section
              </label>
            )}
            <select
              value={value.section_id}
              onChange={handleSectionChange}
              disabled={!canSelectSection}
              className="px-3 py-2 rounded-lg text-sm outline-none min-w-40 disabled:opacity-50"
              style={{
                backgroundColor: "var(--bg-main)",
                border: "1px solid var(--border)",
                color: "var(--text-primary)",
              }}
            >
              <option value="">
                {canSelectSection
                  ? placeholders.section
                  : "Select Batch & Semester"}
              </option>
              {filteredSections.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name} ({sec._count?.students || 0} students)
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={handleClearAll}
            className="px-3 py-2 rounded-lg text-sm transition-colors"
            style={{
              color: "var(--primary)",
              backgroundColor: "transparent",
            }}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Validation Message */}
      {required.department &&
        required.batch &&
        required.semester &&
        value.department_id &&
        !value.batch_id && (
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Please select a batch to continue
          </p>
        )}
    </div>
  );
};

export default CascadingFilters;
