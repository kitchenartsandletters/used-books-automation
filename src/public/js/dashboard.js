// src/public/js/dashboard.js

$(document).ready(function() {
  // Toggle sidebar
  $('#sidebarToggleTop').on('click', function() {
    $('.sidebar').toggleClass('collapsed');
    $('.main').toggleClass('expanded');
  });
  
  // Auto-dismiss alerts after 5 seconds
  $('.alert-dismissible').each(function() {
    const alert = $(this);
    setTimeout(function() {
      alert.alert('close');
    }, 5000);
  });
  
  // Toggle dropdowns on click
  $('.nav-link.dropdown-toggle').on('click', function(e) {
    e.preventDefault();
    $(this).next('.dropdown-menu').toggleClass('show');
  });
  
  // Close dropdowns when clicking outside
  $(document).on('click', function(e) {
    if (!$(e.target).hasClass('dropdown-toggle') && !$(e.target).parents().hasClass('dropdown-toggle')) {
      $('.dropdown-menu').removeClass('show');
    }
  });
  
  // Activate tooltips
  $('[data-toggle="tooltip"]').tooltip();
  
  // Scroll to top button
  $(window).scroll(function() {
    if ($(this).scrollTop() > 100) {
      $('.scroll-to-top').fadeIn();
    } else {
      $('.scroll-to-top').fadeOut();
    }
  });
  
  $('.scroll-to-top').click(function() {
    $('html, body').animate({
      scrollTop: 0
    }, 500);
    return false;
  });
  
  // Data table initialization (if present)
  if ($.fn.DataTable && $('.dataTable').length > 0) {
    $('.dataTable').DataTable({
      responsive: true
    });
  }
  
  // Confirm actions
  $('form[data-confirm]').on('submit', function(e) {
    const message = $(this).data('confirm') || 'Are you sure you want to perform this action?';
    if (!confirm(message)) {
      e.preventDefault();
      return false;
    }
  });
  
  // Form validation
  $('form.needs-validation').on('submit', function(e) {
    if (this.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }
    $(this).addClass('was-validated');
  });
  
  // Handle book filtering
  $('#books-filter-form').on('submit', function(e) {
    e.preventDefault();
    const filter = $('#filter').val();
    const search = $('#search').val();
    let url = '/dashboard/books';
    
    const params = [];
    if (filter && filter !== 'all') {
      params.push(`filter=${filter}`);
    }
    if (search) {
      params.push(`search=${encodeURIComponent(search)}`);
    }
    
    if (params.length > 0) {
      url += `?${params.join('&')}`;
    }
    
    window.location.href = url;
  });
  
  // Sidebar highlight current page
  const currentPath = window.location.pathname;
  $('.nav-item .nav-link').each(function() {
    const href = $(this).attr('href');
    if (href === currentPath) {
      $(this).parent().addClass('active');
    }
  });
});