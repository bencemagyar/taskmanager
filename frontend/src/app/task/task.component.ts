import { NgFor } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Task, TaskService } from '../task.service';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss'],
  standalone: true,
  imports: [FormsModule, NgFor],
})
export class TaskComponent {
  tasks: Task[] = [];
  newTask: Task = { id: '', name: '', assignedTo: '', isCompleted: false };

  constructor(private taskService: TaskService) {
    this.taskService.tasks$.subscribe((tasks) => {
      this.tasks = tasks;
    });
  }

  createTask() {
    if (this.newTask.name && this.newTask.assignedTo) {
      this.taskService.createTask(this.newTask);
      this.newTask = { id: '', name: '', assignedTo: '', isCompleted: false };
    }
  }

  updateTask(task: Task) {
    this.taskService.updateTask(task);
  }

  deleteTask(taskId: string) {
    this.taskService.deleteTask(taskId);
  }

  toggleTaskCompletion(task: Task) {
    task.isCompleted = !task.isCompleted;
    this.updateTask(task);
  }
}
