namespace TaskManagerApp.Models
{
    public class TaskModel
    {
        public string Id { get; set; }
        public string Name { get; set; }
        public string AssignedTo { get; set; }
        public bool IsCompleted { get; set; }
    }
}
