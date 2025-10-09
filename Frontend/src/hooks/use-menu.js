export const useMenu = (pathname) => {
  const isActive = (path) => {
    // Normalize and guard
    if (!path) return false;
    const basePath = path.split('?')[0].split('#')[0];

    if (basePath === '/') {
      return pathname === '/';
    }

    // Prevent root dashboard paths from being active on all sub-routes
    const rootPaths = ['/manager', '/employee', '/account-manager', '/intern'];
    if (rootPaths.includes(basePath)) {
      return pathname === basePath || pathname === `${basePath}/dashboard`;
    }

    // For other items, match exact or nested routes under the path
    return pathname === basePath || pathname.startsWith(`${basePath}/`);
  };

  const hasActiveChild = (children) => {
    if (!children || !Array.isArray(children)) return false;
    return children.some(
      (child) =>
        (child.path && isActive(child.path)) ||
        (child.children && hasActiveChild(child.children)),
    );
  };

  const isItemActive = (item) => {
    return (
      (item.path ? isActive(item.path) : false) ||
      (item.children ? hasActiveChild(item.children) : false)
    );
  };

  const getCurrentItem = (items) => {
    for (const item of items) {
      if (item.path && isActive(item.path)) {
        if (item.children && item.children.length > 0) {
          const childMatch = getCurrentItem(item.children);
          return childMatch || item;
        }
        return item;
      }
      if (item.children && item.children.length > 0) {
        const childMatch = getCurrentItem(item.children);
        if (childMatch) {
          return childMatch;
        }
      }
    }
    return undefined;
  };

  const getBreadcrumb = (items) => {
    const findBreadcrumb = (nodes, breadcrumb = []) => {
      for (const item of nodes) {
        const currentBreadcrumb = [...breadcrumb, item];

        // Check if this item is active
        if (item.path && isActive(item.path)) {
          return currentBreadcrumb; // Return the breadcrumb up to this point
        }

        // If item has children, recurse and check them
        if (item.children && item.children.length > 0) {
          const childBreadcrumb = findBreadcrumb(
            item.children,
            currentBreadcrumb,
          );
          if (childBreadcrumb.length > currentBreadcrumb.length) {
            return childBreadcrumb; // Return the deeper breadcrumb if found
          }
        }
      }
      return breadcrumb; // Return current breadcrumb if no match found
    };

    const breadcrumb = findBreadcrumb(items);
    return breadcrumb.length > 0 ? breadcrumb : [];
  };

  const getChildren = (items, level) => {
    const hasActiveChildAtLevel = (items) => {
      for (const item of items) {
        if (
          (item.path && isActive(item.path)) ||
          (item.children && hasActiveChildAtLevel(item.children))
        ) {
          return true;
        }
      }
      return false;
    };

    const findChildren = (items, targetLevel, currentLevel = 0) => {
      for (const item of items) {
        if (item.children) {
          if (
            targetLevel === currentLevel &&
            hasActiveChildAtLevel(item.children)
          ) {
            return item.children;
          }
          const children = findChildren(
            item.children,
            targetLevel,
            currentLevel + 1,
          );
          if (children) {
            return children;
          }
        } else if (targetLevel === currentLevel && item.path && isActive(item.path)) {
          return items;
        }
      }
      return null;
    };

    return findChildren(items, level);
  };

  return {
    isActive,
    hasActiveChild,
    isItemActive,
    getCurrentItem,
    getBreadcrumb,
    getChildren,
  };
};
