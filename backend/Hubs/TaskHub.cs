using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Threading.Tasks;
using TaskManagerApp.Models;

namespace TaskManagerApp.Hubs
{
    public class TaskHub : Hub
    {
        private static List<TaskModel> Tasks = new List<TaskModel>();

        public async Task CreateTask(TaskModel task)
        {
            task.Id = System.Guid.NewGuid().ToString();
            Tasks.Add(task);
            await Clients.All.SendAsync("TaskCreated", task);
        }

        public async Task UpdateTask(TaskModel task)
        {
            var existingTask = Tasks.Find(t => t.Id == task.Id);
            if (existingTask != null)
            {
                existingTask.Name = task.Name;
                existingTask.AssignedTo = task.AssignedTo;
                existingTask.IsCompleted = task.IsCompleted;
                await Clients.All.SendAsync("TaskUpdated", existingTask);
            }
        }

        public async Task DeleteTask(string taskId)
        {
            var task = Tasks.Find(t => t.Id == taskId);
            if (task != null)
            {
                Tasks.Remove(task);
                await Clients.All.SendAsync("TaskDeleted", taskId);
            }
        }

        public async Task GetAllTasks()
        {
            await Clients.Caller.SendAsync("ReceiveTasks", Tasks);
        }
    }
}
