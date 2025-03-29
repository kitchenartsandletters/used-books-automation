<!-- src/views/error.ejs -->
<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css">
</head>
<body>
  <div class="container mt-5">
    <div class="card">
      <div class="card-header bg-danger text-white">
        <h3 class="card-title">Error</h3>
      </div>
      <div class="card-body">
        <p><%= error %></p>
        <a href="/dashboard" class="btn btn-primary">Return to Dashboard</a>
      </div>
    </div>
  </div>
</body>
</html>