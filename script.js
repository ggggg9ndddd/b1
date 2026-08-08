const defaultTasks=[
  {title:'مراجعة درس المتباينات',subject:'الرياضيات',time:'04:00 م',done:false},
  {title:'حل واجب الفصل الثالث',subject:'الفيزياء',time:'05:30 م',done:false},
  {title:'حفظ قصيدة وطنية',subject:'اللغة العربية',time:'07:00 م',done:true},
  {title:'مراجعة قواعد المضارع',subject:'اللغة الإنجليزية',time:'08:00 م',done:false},
  {title:'قراءة ملخص الدرس',subject:'الفيزياء',time:'09:00 م',done:true}
];
let tasks=JSON.parse(localStorage.getItem('studyTasks')||'null')||defaultTasks;
const classes={الرياضيات:'math',الفيزياء:'science','اللغة العربية':'arabic','اللغة الإنجليزية':'math'};
const list=document.querySelector('#taskList');
function save(){localStorage.setItem('studyTasks',JSON.stringify(tasks))}
function render(){list.innerHTML='';tasks.forEach((task,index)=>{const item=document.createElement('article');item.className=`task ${task.done?'done':''}`;item.innerHTML=`<input type="checkbox" ${task.done?'checked':''} aria-label="إنجاز المهمة"><div><span class="task-title">${task.title}</span><span class="tag ${classes[task.subject]||'math'}">${task.subject}</span></div><div class="task-info"><time>${task.time}</time></div>`;item.querySelector('input').onchange=()=>{tasks[index].done=!tasks[index].done;save();render()};list.append(item)});const done=tasks.filter(t=>t.done).length,total=tasks.length,percentage=total?Math.round(done/total*100):0;document.querySelector('#doneCount').textContent=done;document.querySelector('#totalCount').textContent=total;document.querySelector('#progressPercent').textContent=percentage+'%'}
const days=[['الأحد','9'],['الإثنين','10'],['الثلاثاء','11'],['الأربعاء','12'],['الخميس','13'],['الجمعة','14'],['السبت','15']];
document.querySelector('#weekDays').innerHTML=days.map((d,i)=>`<div class="day ${i===0?'today':''}">${d[0]}<strong>${d[1]}</strong>${i<5?'<i></i>':''}</div>`).join('');
const modal=document.querySelector('#modal');document.querySelector('#openModal').onclick=()=>modal.hidden=false;document.querySelector('#closeModal').onclick=()=>modal.hidden=true;modal.onclick=e=>{if(e.target===modal)modal.hidden=true};
document.querySelector('#taskForm').onsubmit=e=>{e.preventDefault();const time=document.querySelector('#taskTime').value;const [h,m]=time.split(':').map(Number);const period=h>=12?'م':'ص';const formatted=`${((h+11)%12+1).toString().padStart(2,'0')}:${m.toString().padStart(2,'0')} ${period}`;tasks.unshift({title:document.querySelector('#taskTitle').value,subject:document.querySelector('#taskSubject').value,time:formatted,done:false});save();render();e.target.reset();modal.hidden=true};
document.querySelector('#clearDone').onclick=()=>{tasks=tasks.filter(t=>!t.done);save();render()};render();
