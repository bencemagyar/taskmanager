import { Injectable } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { BehaviorSubject } from 'rxjs';

export interface Task {
  id: string;
  name: string;
  assignedTo: string;
  isCompleted: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class TaskService {
  private hubConnection!: signalR.HubConnection;
  private tasksSubject = new BehaviorSubject<Task[]>([]);
  tasks$ = this.tasksSubject.asObservable();

  constructor() {
    this.startConnection();
  }

  private startConnection() {
    this.hubConnection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5282/taskHub') // Replace with your backend URL
      .build();

    this.hubConnection
      .start()
      .then(() => this.getAllTasks())
      .catch((err) => console.log('Error while starting connection: ' + err));

    this.hubConnection.on('ReceiveTasks', (tasks: Task[]) => {
      this.tasksSubject.next(tasks);
    });

    this.hubConnection.on('TaskCreated', (task: Task) => {
      const currentTasks = this.tasksSubject.value;
      this.tasksSubject.next([...currentTasks, task]);
    });

    this.hubConnection.on('TaskUpdated', (updatedTask: Task) => {
      const currentTasks = this.tasksSubject.value.map((task) =>
        task.id === updatedTask.id ? updatedTask : task
      );
      this.tasksSubject.next(currentTasks);
    });

    this.hubConnection.on('TaskDeleted', (taskId: string) => {
      const currentTasks = this.tasksSubject.value.filter(
        (task) => task.id !== taskId
      );
      this.tasksSubject.next(currentTasks);
    });
  }

  createTask(task: Task) {
    this.hubConnection
      .invoke('CreateTask', task)
      .catch((err) => console.error(err));
  }

  updateTask(task: Task) {
    this.hubConnection
      .invoke('UpdateTask', task)
      .catch((err) => console.error(err));
  }

  deleteTask(taskId: string) {
    this.hubConnection
      .invoke('DeleteTask', taskId)
      .catch((err) => console.error(err));
  }

  getAllTasks() {
    this.hubConnection.invoke('GetAllTasks').catch((err) => console.error(err));
  }
}
