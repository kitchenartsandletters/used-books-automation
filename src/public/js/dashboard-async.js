// src/public/js/dashboard-async.js

/**
 * Dashboard Asynchronous Loading Script
 * Handles progressive loading of dashboard data to improve performance
 */
document.addEventListener('DOMContentLoaded', function() {
  // Cache versions to track updates
  const cacheVersions = {
    stats: 0,
    books: 0,
    redirects: 0,
    logs: 0
  };
  
  // Initialize dashboard with cached data first, then refresh
  initializeDashboard();
  
  // Setup periodic refresh for real-time data
  setupPeriodicRefresh();
  
  /**
   * Initialize dashboard with cached data
   */
  function initializeDashboard() {
    // Load each section asynchronously
    loadDashboardStats();
    
    // If we're on a specific page, load that content
    const currentPath = window.location.pathname;
    
    if (currentPath.includes('/books')) {
      loadBooksData();
    } else if (currentPath.includes('/redirects')) {
      loadRedirectsData();
    } else if (currentPath.includes('/logs')) {
      loadLogsData();
    }
  }
  
  /**
   * Load dashboard stats asynchronously
   */
// Fix for loading content in dashboard-async.js
function loadDashboardStats() {
    const statsContainer = document.getElementById('dashboard-stats');
    if (!statsContainer) return;
    
    const loadingElement = document.getElementById('stats-loading');
    const contentElement = document.getElementById('stats-content');
    
    // Make sure loading is visible, content is hidden
    if (loadingElement) loadingElement.style.display = 'block';
    if (contentElement) contentElement.style.display = 'none';
    
    // Make an API request to get the stats
    fetch('/api/dashboard/stats?version=' + cacheVersions.stats)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.fresh === false) {
          // Update the stats in the UI
          updateDashboardStats(data.stats);
          // Update stored version
          cacheVersions.stats = data.version;
          
          // Show content, hide loading
          if (loadingElement) loadingElement.style.display = 'none';
          if (contentElement) contentElement.style.display = 'block';
        }
      })
      .catch(error => {
        console.error('Error loading dashboard stats:', error);
        // On error, still hide loading and show error message
        if (loadingElement) loadingElement.style.display = 'none';
        if (contentElement) {
          contentElement.style.display = 'block';
          contentElement.innerHTML = '<div class="alert alert-danger">Failed to load dashboard statistics</div>';
        }
      });
  }

// Fix for system status panel loading in dashboard-async.js
function loadSystemStatus() {
    const statusLoading = document.getElementById('status-loading');
    const statusContent = document.getElementById('status-content');
    
    if (!statusLoading || !statusContent) return;
    
    // Make sure loading is visible, content is hidden
    statusLoading.style.display = 'block';
    statusContent.style.display = 'none';
    
    // We can use the same stats data that was already loaded
    // Or make a more targeted API call if needed
    fetch('/api/dashboard/stats?version=' + cacheVersions.stats)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.fresh === false) {
          // Update system status fields
          if (document.getElementById('last-scan-time')) {
            document.getElementById('last-scan-time').textContent = data.stats.lastScanTime;
          }
          
          // Update webhooks status
          const webhooksStatus = document.getElementById('webhooks-status');
          const webhooksText = document.getElementById('webhooks-text');
          if (webhooksStatus) {
            webhooksStatus.classList.remove('status-active', 'status-inactive');
            webhooksStatus.classList.add(data.stats.webhooksRegistered ? 'status-active' : 'status-inactive');
          }
          if (webhooksText) {
            webhooksText.textContent = data.stats.webhooksRegistered ? 'Yes' : 'No';
          }
          
          // Update cron jobs status
          const cronStatus = document.getElementById('cron-status');
          const cronText = document.getElementById('cron-text');
          if (cronStatus && data.stats.cronJobsActive !== undefined) {
            cronStatus.classList.remove('status-active', 'status-inactive');
            cronStatus.classList.add(data.stats.cronJobsActive ? 'status-active' : 'status-inactive');
          }
          if (cronText && data.stats.cronJobsActive !== undefined) {
            cronText.textContent = data.stats.cronJobsActive ? 'Yes' : 'No';
          }
          
          // Show content, hide loading
          statusLoading.style.display = 'none';
          statusContent.style.display = 'block';
        }
      })
      .catch(error => {
        console.error('Error loading system status:', error);
        // On error, still hide loading and show error message
        statusLoading.style.display = 'none';
        statusContent.style.display = 'block';
        statusContent.innerHTML = '<div class="alert alert-danger">Failed to load system status</div>';
      });
  }
  
  // Similarly for the activity panel
  function loadActivityData() {
    const activityLoading = document.getElementById('activity-loading');
    const activityContent = document.getElementById('activity-content');
    
    if (!activityLoading || !activityContent) return;
    
    activityLoading.style.display = 'block';
    activityContent.style.display = 'none';
    
    fetch('/api/dashboard/logs?limit=5&version=' + cacheVersions.logs)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.fresh === false) {
          // Update activity content with notifications
          if (data.notifications && data.notifications.length > 0) {
            // Build HTML for notifications
            let html = '<ul class="timeline">';
            data.notifications.forEach(notification => {
              html += `
                <li class="timeline-item">
                  <div class="timeline-marker ${notification.type === 'error' ? 'bg-danger' : notification.type === 'warning' ? 'bg-warning' : 'bg-primary'}"></div>
                  <div class="timeline-content">
                    <h3 class="timeline-title">${notification.subject}</h3>
                    <p>${notification.message}</p>
                    <small class="text-muted">
                      ${new Date(notification.timestamp).toLocaleString()}
                    </small>
                  </div>
                </li>
              `;
            });
            html += '</ul>';
            html += `
              <div class="text-center mt-4">
                <a href="/dashboard/logs" class="btn btn-sm btn-primary">View All Activity</a>
              </div>
            `;
            activityContent.innerHTML = html;
          } else {
            activityContent.innerHTML = `
              <p class="text-center my-4">No recent activity found.</p>
              <div class="text-center">
                <a href="/dashboard/logs" class="btn btn-sm btn-primary">View All Activity</a>
              </div>
            `;
          }
          
          // Update stored version
          cacheVersions.logs = data.version;
          
          // Show content, hide loading
          activityLoading.style.display = 'none';
          activityContent.style.display = 'block';
        }
      })
      .catch(error => {
        console.error('Error loading activity data:', error);
        activityLoading.style.display = 'none';
        activityContent.style.display = 'block';
        activityContent.innerHTML = '<div class="alert alert-danger">Failed to load activity data</div>';
      });
  }

  /**
   * Update dashboard stats in the UI
   */
  function updateDashboardStats(stats) {
    // Update stats numbers
    if (document.getElementById('total-books')) {
      document.getElementById('total-books').textContent = stats.totalBooks;
    }
    if (document.getElementById('published-books')) {
      document.getElementById('published-books').textContent = stats.publishedBooks;
    }
    if (document.getElementById('unpublished-books')) {
      document.getElementById('unpublished-books').textContent = stats.unpublishedBooks;
    }
    if (document.getElementById('total-redirects')) {
      document.getElementById('total-redirects').textContent = stats.totalRedirects;
    }
    if (document.getElementById('last-scan-time')) {
      document.getElementById('last-scan-time').textContent = stats.lastScanTime;
    }
    
    // Update status indicators
    if (document.getElementById('webhooks-status')) {
      const webhooksStatus = document.getElementById('webhooks-status');
      webhooksStatus.classList.remove('status-active', 'status-inactive');
      webhooksStatus.classList.add(stats.webhooksRegistered ? 'status-active' : 'status-inactive');
    }
    
    // Remove loading indicator if present
    const loadingElement = document.getElementById('stats-loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    // Show stats container
    const statsContent = document.getElementById('stats-content');
    if (statsContent) {
      statsContent.style.display = 'block';
    }
  }
  
  /**
   * Load books data asynchronously
   */
  function loadBooksData() {
    const booksContainer = document.getElementById('books-container');
    if (!booksContainer) return;
    
    // Get current query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const page = urlParams.get('page') || 1;
    const limit = urlParams.get('limit') || 20;
    const filter = urlParams.get('filter') || 'all';
    const search = urlParams.get('search') || '';
    
    // Make API request to get books data
    fetch(`/api/dashboard/books?page=${page}&limit=${limit}&filter=${filter}&search=${search}&version=${cacheVersions.books}`)
      .then(response => response.json())
      .then(data => {
        if (data.fresh === false) {
          // Update books in the UI
          updateBooksTable(data.books, data.pagination);
          // Update stored version
          cacheVersions.books = data.version;
        }
      })
      .catch(error => {
        console.error('Error loading books data:', error);
      });
  }
  
  /**
   * Update books table in the UI
   */
  function updateBooksTable(books, pagination) {
    const booksTableBody = document.querySelector('#books-table tbody');
    if (!booksTableBody) return;
    
    // Clear existing rows
    booksTableBody.innerHTML = '';
    
    if (books.length === 0) {
      // Show no books message
      booksTableBody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center py-5">
            <i class="fas fa-book fa-4x mb-3 text-gray-300"></i>
            <p class="lead text-gray-500">No books found matching your criteria.</p>
          </td>
        </tr>
      `;
    } else {
      // Add book rows
      books.forEach(book => {
        const row = document.createElement('tr');
        
        // Calculate total inventory
        const totalInventory = book.variants.reduce((sum, variant) => {
          return sum + (variant.inventory_quantity || 0);
        }, 0);
        
        // Create the row HTML
        row.innerHTML = `
          <td>${book.title}</td>
          <td><small><code>${book.handle}</code></small></td>
          <td>
            <span class="badge badge-${book.published_at ? 'success' : 'warning'}">
              ${book.published_at ? 'Published' : 'Unpublished'}
            </span>
          </td>
          <td>
            <span class="badge badge-${totalInventory > 0 ? 'success' : 'danger'}">
              ${totalInventory > 0 ? totalInventory + ' in stock' : 'Out of stock'}
            </span>
          </td>
          <td>
            <a href="https://${shopUrl}/admin/products/${book.id}" class="btn btn-sm btn-info" target="_blank" data-toggle="tooltip" title="View in Shopify">
              <i class="fas fa-external-link-alt"></i>
            </a>
            
            ${book.published_at ? 
            `<form action="/dashboard/books/${book.id}/unpublish" method="post" class="d-inline" data-confirm="Are you sure you want to unpublish this book?">
              <button type="submit" class="btn btn-sm btn-warning" data-toggle="tooltip" title="Unpublish">
                <i class="fas fa-eye-slash"></i>
              </button>
            </form>` : 
            `<form action="/dashboard/books/${book.id}/publish" method="post" class="d-inline" data-confirm="Are you sure you want to publish this book?">
              <button type="submit" class="btn btn-sm btn-success" data-toggle="tooltip" title="Publish">
                <i class="fas fa-eye"></i>
              </button>
            </form>`}
            
            <form action="/api/products/${book.id}/check" method="post" class="d-inline">
              <button type="submit" class="btn btn-sm btn-primary" data-toggle="tooltip" title="Manual Check">
                <i class="fas fa-sync"></i>
              </button>
            </form>
          </td>
        `;
        
        booksTableBody.appendChild(row);
      });
    }
    
    // Update pagination if it exists
    updatePagination(pagination);
    
    // Remove loading indicator
    const loadingElement = document.getElementById('books-loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    // Show books container
    const booksContent = document.getElementById('books-content');
    if (booksContent) {
      booksContent.style.display = 'block';
    }
    
    // Reactivate tooltips
    if (typeof $ !== 'undefined' && $.fn.tooltip) {
      $('[data-toggle="tooltip"]').tooltip();
    }
  }
  
  /**
   * Update pagination controls
   */
  function updatePagination(pagination) {
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer || !pagination) return;
    
    // Get current query parameters to preserve them
    const urlParams = new URLSearchParams(window.location.search);
    const filter = urlParams.get('filter') || 'all';
    const search = urlParams.get('search') || '';
    
    // Clear existing pagination
    paginationContainer.innerHTML = '';
    
    // Previous page button
    const prevPageItem = document.createElement('li');
    prevPageItem.className = `page-item ${pagination.hasPrevPage ? '' : 'disabled'}`;
    prevPageItem.innerHTML = `
      <a class="page-link" href="/dashboard/books?page=${pagination.page - 1}&limit=${pagination.limit}${search ? '&search=' + search : ''}${filter !== 'all' ? '&filter=' + filter : ''}" ${pagination.hasPrevPage ? '' : 'tabindex="-1" aria-disabled="true"'}>
        Previous
      </a>
    `;
    paginationContainer.appendChild(prevPageItem);
    
    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
      if (
        i === 1 || 
        i === pagination.totalPages || 
        (i >= pagination.page - 1 && i <= pagination.page + 1)
      ) {
        const pageItem = document.createElement('li');
        pageItem.className = `page-item ${pagination.page === i ? 'active' : ''}`;
        pageItem.innerHTML = `
          <a class="page-link" href="/dashboard/books?page=${i}&limit=${pagination.limit}${search ? '&search=' + search : ''}${filter !== 'all' ? '&filter=' + filter : ''}">
            ${i}
          </a>
        `;
        paginationContainer.appendChild(pageItem);
      } else if (
        (i === 2 && pagination.page > 3) || 
        (i === pagination.totalPages - 1 && pagination.page < pagination.totalPages - 2)
      ) {
        const ellipsisItem = document.createElement('li');
        ellipsisItem.className = 'page-item disabled';
        ellipsisItem.innerHTML = '<span class="page-link">...</span>';
        paginationContainer.appendChild(ellipsisItem);
      }
    }
    
    // Next page button
    const nextPageItem = document.createElement('li');
    nextPageItem.className = `page-item ${pagination.hasNextPage ? '' : 'disabled'}`;
    nextPageItem.innerHTML = `
      <a class="page-link" href="/dashboard/books?page=${pagination.page + 1}&limit=${pagination.limit}${search ? '&search=' + search : ''}${filter !== 'all' ? '&filter=' + filter : ''}" ${pagination.hasNextPage ? '' : 'tabindex="-1" aria-disabled="true"'}>
        Next
      </a>
    `;
    paginationContainer.appendChild(nextPageItem);
  }
  
  /**
   * Load redirects data asynchronously
   */
  function loadRedirectsData() {
    const redirectsContainer = document.getElementById('redirects-container');
    if (!redirectsContainer) return;
    
    // Make API request to get redirects
    fetch('/api/dashboard/redirects?version=' + cacheVersions.redirects)
      .then(response => response.json())
      .then(data => {
        if (data.fresh === false) {
          // Update redirects in the UI
          updateRedirectsTable(data.redirects);
          // Update stored version
          cacheVersions.redirects = data.version;
        }
      })
      .catch(error => {
        console.error('Error loading redirects data:', error);
      });
  }
  
  /**
   * Update redirects table in the UI
   */
  function updateRedirectsTable(redirects) {
    const redirectsTableBody = document.querySelector('#redirects-table tbody');
    if (!redirectsTableBody) return;
    
    // Get shop URL for testing redirects
    const shopUrl = document.getElementById('shop-url').value;
    
    // Clear existing rows
    redirectsTableBody.innerHTML = '';
    
    if (redirects.length === 0) {
      // Show no redirects message
      redirectsTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-5">
            <i class="fas fa-exchange-alt fa-4x mb-3 text-gray-300"></i>
            <p class="lead text-gray-500">No redirects found.</p>
          </td>
        </tr>
      `;
    } else {
      // Add redirect rows
      redirects.forEach(redirect => {
        const row = document.createElement('tr');
        
        row.innerHTML = `
          <td>
            <small><code>${redirect.path}</code></small>
          </td>
          <td>
            <small><code>${redirect.target}</code></small>
          </td>
          <td>
            <span class="badge badge-${redirect.redirect_type === '301' ? 'dark' : 'info'}">
              ${redirect.redirect_type}
            </span>
          </td>
          <td>
            <a href="https://${shopUrl}${redirect.path}" class="btn btn-sm btn-info" target="_blank" data-toggle="tooltip" title="Test Redirect">
              <i class="fas fa-external-link-alt"></i>
            </a>
            
            <button type="button" class="btn btn-sm btn-primary" data-toggle="modal" data-target="#editRedirectModal" data-id="${redirect.id}" data-path="${redirect.path}" data-target="${redirect.target}" data-type="${redirect.redirect_type}">
              <i class="fas fa-edit"></i>
            </button>
            
            <form action="/dashboard/redirects/${redirect.id}/delete" method="post" class="d-inline" data-confirm="Are you sure you want to delete this redirect?">
              <button type="submit" class="btn btn-sm btn-danger" data-toggle="tooltip" title="Delete Redirect">
                <i class="fas fa-trash"></i>
              </button>
            </form>
          </td>
        `;
        
        redirectsTableBody.appendChild(row);
      });
    }
    
    // Remove loading indicator
    const loadingElement = document.getElementById('redirects-loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    // Show redirects container
    const redirectsContent = document.getElementById('redirects-content');
    if (redirectsContent) {
      redirectsContent.style.display = 'block';
    }
    
    // Reactivate tooltips and modals
    if (typeof $ !== 'undefined') {
      if ($.fn.tooltip) {
        $('[data-toggle="tooltip"]').tooltip();
      }
      
      // Set up edit modal data
      $('#editRedirectModal').on('show.bs.modal', function (event) {
        const button = $(event.relatedTarget);
        const id = button.data('id');
        const path = button.data('path').replace('/products/', '');
        const target = button.data('target').replace('/products/', '');
        const type = button.data('type');
        
        const modal = $(this);
        modal.find('#editRedirectId').val(id);
        modal.find('#editPath').val(path);
        modal.find('#editTarget').val(target);
        modal.find('#editRedirectType').val(type);
      });
    }
  }
  
  /**
   * Load logs data asynchronously
   */
  function loadLogsData() {
    const logsContainer = document.getElementById('logs-container');
    if (!logsContainer) return;
    
    // Get query parameters
    const urlParams = new URLSearchParams(window.location.search);
    const type = urlParams.get('type') || 'all';
    
    // Make API request to get logs
    fetch(`/api/dashboard/logs?type=${type}&version=${cacheVersions.logs}`)
      .then(response => response.json())
      .then(data => {
        if (data.fresh === false) {
          // Update logs in the UI
          updateLogsTable(data.notifications);
          // Update stored version
          cacheVersions.logs = data.version;
        }
      })
      .catch(error => {
        console.error('Error loading logs data:', error);
      });
  }
  
  /**
   * Update logs table in the UI
   */
  function updateLogsTable(notifications) {
    const logsTableBody = document.querySelector('#logs-table tbody');
    if (!logsTableBody) return;
    
    // Clear existing rows
    logsTableBody.innerHTML = '';
    
    if (!notifications || notifications.length === 0) {
      // Show no logs message
      logsTableBody.innerHTML = `
        <tr>
          <td colspan="4" class="text-center py-5">
            <i class="fas fa-history fa-4x mb-3 text-gray-300"></i>
            <p class="lead text-gray-500">No logs found.</p>
          </td>
        </tr>
      `;
    } else {
      // Add log rows
      notifications.forEach(notification => {
        const row = document.createElement('tr');
        
        // Set row class based on notification type
        row.className = `log-row ${notification.type === 'error' ? 'table-danger' : notification.type === 'warning' ? 'table-warning' : ''}`;
        
        row.innerHTML = `
          <td>
            <small>${new Date(notification.timestamp).toLocaleString()}</small>
          </td>
          <td>
            <span class="badge badge-${notification.type === 'error' ? 'danger' : notification.type === 'warning' ? 'warning' : 'primary'}">
              ${notification.type}
            </span>
          </td>
          <td>${notification.subject}</td>
          <td>${notification.message}</td>
        `;
        
        logsTableBody.appendChild(row);
      });
    }
    
    // Remove loading indicator
    const loadingElement = document.getElementById('logs-loading');
    if (loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    // Show logs container
    const logsContent = document.getElementById('logs-content');
    if (logsContent) {
      logsContent.style.display = 'block';
    }
  }
  
  /**
   * Set up periodic refresh for real-time data
   */
  function setupPeriodicRefresh() {
    // Refresh dashboard stats every 30 seconds
    setInterval(loadDashboardStats, 30000);
    
    // Refresh books data every 60 seconds on the books page
    if (window.location.pathname.includes('/books')) {
      setInterval(loadBooksData, 60000);
    }
    
    // Refresh redirects data every 60 seconds on the redirects page
    if (window.location.pathname.includes('/redirects')) {
      setInterval(loadRedirectsData, 60000);
    }
    
    // Refresh logs data every 30 seconds on the logs page
    if (window.location.pathname.includes('/logs')) {
      setInterval(loadLogsData, 30000);
    }
  }
  
    // Check and create loading and content elements
    // This function checks if the loading and content elements exist, and creates them if they don't
    // It also returns the container, loading element, and content element for further manipulation
    // This function is used to ensure that the loading and content elements are present in the DOM
    // before attempting to load data into them    
    function checkAndCreateElement(containerId, type, message) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        // Check if loading element exists, create if missing
        let loadingElement = document.getElementById(`${containerId}-loading`);
        if (!loadingElement) {
        loadingElement = document.createElement('div');
        loadingElement.id = `${containerId}-loading`;
        loadingElement.className = 'loading-container';
        loadingElement.innerHTML = `
            <div class="spinner-border text-primary mb-2" role="status">
            <span class="sr-only">Loading...</span>
            </div>
            <p class="loading-text">${message || 'Loading...'}</p>
        `;
        container.appendChild(loadingElement);
        }
        
        // Check if content element exists, create if missing
        let contentElement = document.getElementById(`${containerId}-content`);
        if (!contentElement) {
        contentElement = document.createElement('div');
        contentElement.id = `${containerId}-content`;
        contentElement.className = 'content-container';
        contentElement.style.display = 'none';
        container.appendChild(contentElement);
        }
        
        return {
        container,
        loadingElement,
        contentElement
        };
    }

  // Add global event handlers
  if (document.getElementById('refresh-btn')) {
    document.getElementById('refresh-btn').addEventListener('click', function() {
      // Force refresh all data
      cacheVersions.stats = 0;
      cacheVersions.books = 0;
      cacheVersions.redirects = 0;
      cacheVersions.logs = 0;
      
      // Show loading indicators
      document.querySelectorAll('.loading-container').forEach(el => {
        el.style.display = 'flex';
      });
      
      // Hide content containers
      document.querySelectorAll('.content-container').forEach(el => {
        el.style.display = 'none';
      });
      
      // Reload all data
      loadDashboardStats();
      
      const currentPath = window.location.pathname;
      if (currentPath.includes('/books')) {
        loadBooksData();
      } else if (currentPath.includes('/redirects')) {
        loadRedirectsData();
      } else if (currentPath.includes('/logs')) {
        loadLogsData();
      }
    });
  }
});