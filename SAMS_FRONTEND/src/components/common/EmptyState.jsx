import {
  HiOutlineInbox,
  HiOutlineSearch,
  HiOutlineFilter,
  HiOutlinePlus,
  HiOutlineExclamation,
} from "react-icons/hi";

/* ============================================================
   EmptyState Component
   Consistent empty state UI for all pages
   
   Usage:
   <EmptyState
     type="default" | "search" | "filter" | "action"
     title="No Students Yet"
     description="This section doesn't have any students."
     action="+ Add Students"
     onAction={openModal}
     suggestions={[
       "Try selecting a different filter",
       "Create a new item to get started"
     ]}
   />
============================================================ */

const EmptyState = ({
  type = "default",
  title,
  description,
  action,
  onAction,
  suggestions = [],
  icon,
  className = "",
}) => {
  // Default icons based on type
  const getDefaultIcon = () => {
    switch (type) {
      case "search":
        return <HiOutlineSearch className="w-16 h-16" />;
      case "filter":
        return <HiOutlineFilter className="w-16 h-16" />;
      case "action":
        return <HiOutlinePlus className="w-16 h-16" />;
      default:
        return <HiOutlineInbox className="w-16 h-16" />;
    }
  };

  const iconElement = icon || getDefaultIcon();

  // Styling based on type
  const getStyles = () => {
    switch (type) {
      case "search":
        return {
          iconColor: "var(--text-muted)",
          bgColor: "var(--bg-main)",
        };
      case "filter":
        return {
          iconColor: "var(--primary)",
          bgColor: "var(--primary-subtle)",
        };
      case "action":
        return {
          iconColor: "var(--primary)",
          bgColor: "var(--bg-main)",
        };
      default:
        return {
          iconColor: "var(--text-muted)",
          bgColor: "var(--bg-main)",
        };
    }
  };

  const styles = getStyles();

  return (
    <div
      className={`empty-state ${className}`}
      style={{ textAlign: "center", padding: "3rem 1.5rem" }}
    >
      {/* Icon */}
      <div
        className="empty-state-icon mx-auto mb-4 flex items-center justify-center w-20 h-20 rounded-full"
        style={{
          backgroundColor: styles.bgColor,
          color: styles.iconColor,
        }}
      >
        {iconElement}
      </div>

      {/* Title */}
      <h3
        className="empty-state-title text-lg font-semibold mb-2"
        style={{ color: "var(--text-primary)" }}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className="empty-state-description text-sm mb-4 max-w-md mx-auto"
          style={{ color: "var(--text-secondary)" }}
        >
          {description}
        </p>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <div className="empty-state-suggestions mb-6">
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {suggestions.map((suggestion, index) => (
              <li
                key={index}
                className="text-sm mb-1"
                style={{ color: "var(--text-muted)" }}
              >
                💡 {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Action Button */}
      {action && onAction && (
        <button
          onClick={onAction}
          className="empty-state-action inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors"
          style={{ backgroundColor: "var(--primary)" }}
        >
          {action}
        </button>
      )}
    </div>
  );
};

/* ============================================================
   EmptyState Variations for Common Use Cases
============================================================ */

// No data yet - invite to create first item
export const EmptyStateCreate = ({
  entity = "item",
  onCreate,
  suggestions,
}) => (
  <EmptyState
    type="action"
    title={`No ${entity}s Yet`}
    description={`There are no ${entity.toLowerCase()}s in this view yet. Create your first ${entity.toLowerCase()} to get started.`}
    action={`+ Create ${entity}`}
    onAction={onCreate}
    suggestions={
      suggestions || [
        `Click "Create ${entity}" to add your first ${entity.toLowerCase()}`,
        `Make sure you have the required data first (departments, batches)`,
      ]
    }
  />
);

// No search results
export const EmptyStateSearch = ({
  searchTerm,
  entity = "results",
  onClearSearch,
}) => (
  <EmptyState
    type="search"
    title="No Results Found"
    description={`No ${entity.toLowerCase()} match "${searchTerm}". Try a different search term.`}
    action="Clear Search"
    onAction={onClearSearch}
    suggestions={[
      "Check your spelling",
      "Try a more general search term",
      "Make sure filters are not too restrictive",
    ]}
  />
);

// No filter results
export const EmptyStateFilter = ({
  entity = "results",
  onClearFilters,
  activeFilters,
}) => (
  <EmptyState
    type="filter"
    title="No Matching Results"
    description={`No ${entity.toLowerCase()} match your selected filters.`}
    action="Clear Filters"
    onAction={onClearFilters}
    suggestions={[
      "Try selecting fewer filters",
      "Check if your filter values exist in the system",
      "Reset filters to see all available data",
    ]}
  />
);

// No data available for selection
export const EmptyStateUnavailable = ({
  entity = "sections",
  reason = "No data available",
  suggestions,
}) => (
  <EmptyState
    type="default"
    title={`No ${entity} Available`}
    description={reason}
    suggestions={
      suggestions || [
        "Please ensure required data is created first",
        "Contact administrator if this is unexpected",
      ]
    }
    icon={<HiOutlineExclamation className="w-16 h-16" />}
  />
);

export default EmptyState;
