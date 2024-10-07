# Task Manager - with SignalR and Angular

#### Tartalom:
- [Task](#task)
- [Overview](#overview)
- [Backend](#backend)
- [Frontend](#frontend)


### Overview
Készíts egy egyszerű task manager (feladat kezelő) alkalmazást, ami egyszerre több felhasználó általi szerkesztést is lehetővé tesz. 
Az alkalmazásban lehessen a meglévő `Task`-okat listázni, az egyes listaelemeket módosítani, és törölni is, valamint lehessen új `Task`-ot létrehozni.
Websocket technológia segítségével tedd lehetővé, hogy a lista, vagy annak elemeinek változásáról azonnal értesüljön a többi szerkesztő is.

### Prerequisites:

* .Net 8 SDK telepítése: https://dotnet.microsoft.com/en-us/download/dotnet/8.0
    * Windows-ra az SDK Installers-ből az x64-et érdemes letölteni és futtatni, majd **újraindítani a gépet**
* VSCode
* VSCode C# Devkit Extension: https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit


### Task
- `Id`: `string`
- `Name`: `string`
- `AssignedTo`: `string`
- `Completed`: `boolean`

### Backend

1. Készíts egy új webapi projektet az alábbi paranccsal:
   ```
   dotnet new webapi -n TaskManagerApp
   ```
3. Lépj be a létrehozott projekt mappájába:
   ```
   cd TaskManagerApp
   ```
5. Add hozzá a projekthez a `SignalR` package-et ezzel a paranccsal: 
   ```
   dotnet add package Microsoft.AspNetCore.SignalR
   ```
7. Készíts a projekt mappájába egy `Models` nevű mappát, itt fogjuk tárolni a backenden található típusokat, classokat.
8. A Models mappába hozz létre egy `TaskModel.cs` fájlt az alábbi tartalommal:

   ```cs
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
   ```

6. Készíts egy `Hubs` nevű mappát a projekt mappádba, azon belül pedig egy `TaskHub.cs` fájlt. Ez a fájl lesz felelős a Taskok az azonnali kommunikációjáért. A Hub publikus metódusait kívülről meg lehet hívni, és majd a frontendről meg is fogjuk. Ezek a metódusok nem kötelesek kiértesíteni a frontendet, viszont mi minden egyes hívásra ezt fogjuk tenni, hiszen olyan változást hajtanak végre (pl. létrehoz egy új taskot, vagy töröl egyet), amiről kell, hogy minden kapcsolódó kliens értesüljön, hiszen változást kell okozzon a frontenden is.

   A fájl tartalma az alábbi legyen:
   
   ```cs
   using Microsoft.AspNetCore.SignalR;
   using System.Collections.Generic;
   using System.Threading.Tasks;
   using TaskManagerApp.Models;
   
   namespace TaskManagerApp.Hubs
   {
       public class TaskHub : Hub
       {
           /* 
               Itt tároljuk a backenden a Task-ok listáját.
           */
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
   
   ```


7. Készíts minden metódus fölé kommentet, amben leírod, hogy mi történik a metódusban
8. Nyisd meg a `Program.cs` fájlt, és írd át a tartalmát az alábbiakra:

   ```cs
   var builder = WebApplication.CreateBuilder(args);
   
   builder.Services.AddCors(options =>
   {
       // beállítjuk, hogy a backend engedélyezze a kéréseket a localhost:4200-ról
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
   app.MapHub<TaskHub>("/taskHub");  // Hozzárendeljük a "/taskHub" path-hoz a mi TaskHub típusunkat
   
   app.Run();
   
   ```

9. F5-tel indítsd el a programot.


### Frontend:

1. Készíts egy új Angular projektet 
2. Telepítsd a `@microsoft/signalr` package-et:
   ```
   npm install @microsoft/signalr
   ```
4. Készítsd el a `Task` interface-ét
5. Készíts egy `TaskService`-t, ami a websocket kapcsolatért felel. Ez a service lesz azért is felelős, hogy az alkalmazásban elérhető információkat tartalmazza.
    1. Legyen a service-ben egy `tasksSubject` nenű `BehaviorSubject`, ami Task array-eket tud emittálni, kezdő emittálása pedig egy üres tömb legyen.
    A `tasksSubject`-et tedd privátra, hiszen nem akarjuk, hogy a servicen kívülről más is meg tudja hívni ezen a next() metódust. Szeretnénk viszont, hogy fel tudjanak iratkozni a task-ok változására next-elési lehetőség nélkül, ezért készíts egy publikus `tasks$` adattagot, ami a `tasksSubject`-et Observable-ként adja vissza.
    2. Készítsd el a connection-t a korábban tanultak szerint, és startold el a konstruktorban
    3. Íratkozz fel az összes, a backenden lévő TaskHub által meghatározott eseményre (topic-ra). (onnan látszi, hogy milyen topic-ok vannak, hogy milyen topic-okra küld üzenetet a klienseknek). 
    Minden feliratkozáshoz át kell adnod egy callbacket, aminek a paramétereit szintén a backend általi küldésből tudod kitalálni. (a backend elküldi a topic nevét, és a topicra küldött paramétereket, ezek a paraméterek lesznek a te callbacked paraméterei is)
    4. Valósítsd meg az összes feliratkozásban a callbacket úgy, hogy mindegyik callback süsse el a `tasksSubject` BehaviorSubjectet egy új tömbbel, amiben benne vannak az eddigi elemek, illetve az eseményhez tartozó változás is az eredeti tömbhöz képest. 
    Pl. ha a törlés eseményére iratkozol fel, akkor a callback paraméterben megkapod, hogy melyik task lett törölve, neked pedig egy olyan új többel kell elsütnöd a `tasksSubject`-ot, hogy abban már ez a törölt elem ne legyen benne. Segítség: A BehaviorSubject-ből ki tudjuk olvasni a jelenlegi értékét a `this.tasksSubject.value` property segítségével.
    Ugyanígy, amikor arról kapsz értesítést, hogy módosult egy `Task`, ott is ugyanezt a `tasksSubject`-t kell elsütnöd egy olyan új array-jel, ami tartalmazza az eddigi elemeket, de a módosított elemet is - a módosítással együtt.
    5. Készíts publikus metódusokat a frontendről indítható műveletekhez. Ezeket a metódusokat fogják tudni a komponensek meghívni.
    Mindegyik metódus hívja meg a `connection`-ön a hub-on lévő hozzá tartozó metódust:
        - createTask
        - updateTask
        - deleteTask
        - getAllTasks
        
    (nézd meg, hogy a Hub-on pontosan hogy hívják ezeket a metódusokat)
        
6. Készíts egy TaskList komponents, ami `Task` komponenseket jeleníti meg egymás alatt. A taskokat a `taskService.tasks$` Observable-ből kapja meg. (tesztelésnek a `taskSubject` kezdeti értékébe tegyél pár Task objektumot)
7. Az egyes `Task` listaelemeken legyen egy Checkbox, ami a Completed állapotát tükrözi, jelenítse meg a nevét, és hogy kihez van hozzárendelve az adott task, valamint legyen rajta egy `Delete` button, amivel majd törölni lehet az adott `Task`-ot.
8. A Taskok listája fölött egy sorban legyen két input mező és hozzájuk egy-egy label: `Name`, `Assigned to`, valamint egy `Create task` button, amivel be lehet küldeni a backendnek a `Name` és `Assigned to` mezők értékeit.
9. Az egyes listaelemeknek lehessen módosítani a Completed állapotát.
10. Teszteld le az alkalmazást több böngészőablak egyidejű használatával, és nézd meg, hogy minden ablakban azonnal megjelennek -e az egyik ablakban végrehajtott változások.
11. Tegyél breakpoint-okat a DevTools-ba oda, ahol meghívod a backend metódusokat, illetve a backendre is, a hívott metódusokba, valamint a frontenden lévő feliratkozások callback-jeibe, és léptetéssen nézd végig, hogy milyen sorrendben történik a hívásláncolat. Írd le a projektedbe egy Működés.md fájlba, amit tapasztaltál.

Mind a `Create`, az `Update` és a `Delete` funkcionalitások úgy működjenek, hogy a taskService megfelelő metódusának segítségével beküldik a backendnek, hogy mi történt, a backend pedig kiértesíti a kapcsolódott klienseket különböző websocket üzenetekkel arról, ami történt, a kliensek pedig feliratkozásokkal reagálnak rá.
