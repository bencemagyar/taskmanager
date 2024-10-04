using TaskManagerApp.Hubs;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", builder =>
    {
        builder.WithOrigins("http://localhost:4200")
               .AllowAnyHeader()
               .AllowAnyMethod()
               .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddSignalR();  // Add SignalR

var app = builder.Build();

app.UseCors("CorsPolicy");

app.MapControllers();
app.MapHub<TaskHub>("/taskHub");  // Map the SignalR hub

app.Run();
