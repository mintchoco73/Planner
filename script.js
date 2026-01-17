/* ---------- DARK MODE ---------- */
const toggle = document.getElementById("darkToggle");
const body = document.body;

if(localStorage.getItem("dark")==="true") body.classList.add("dark");

toggle.onclick = () => {
  body.classList.toggle("dark");
  localStorage.setItem("dark", body.classList.contains("dark"));
};

/* ---------- LOCAL STORAGE HELPERS ---------- */
function saveDayToLocal(day) {
  const dayNum = day.dataset.day;
  const rows = [];
  day.querySelectorAll(".row:not(.header)").forEach(row => {
    const inputs = row.querySelectorAll("input");
    rows.push({
      time: inputs[0].value,
      activity: inputs[1].value,
      cost: inputs[2].value
    });
  });
  localStorage.setItem(`day-${dayNum}`, JSON.stringify(rows));
}

function loadDayFromLocal(day) {
  const dayNum = day.dataset.day;
  const data = JSON.parse(localStorage.getItem(`day-${dayNum}`) || "[]");
  const timetable = day.querySelector(".timetable");
  timetable.innerHTML = "";
  if(data.length === 0) {
    // If no saved data, create one default row
    addRow(timetable, {}, true);
  } else {
    data.forEach((rowData, i) => addRow(timetable, rowData, i === 0));
  }
}

/* ---------- ADD / DELETE ROW ---------- */
function addRow(timetable, data={}, isFirst=false){
  const row = document.createElement("div");
  row.className="row";
  row.innerHTML=`
    <button class="add">＋</button>
    <input type="time" value="${data.time||''}">
    <input type="text" value="${data.activity||''}">
    <input type="text" value="${data.cost||'$0.00'}" data-type="cost">
    <button class="delete">✕</button>
  `;
  timetable.appendChild(row);
  attachRowEvents(row, isFirst);
  attachCostInput(row);
  updateTotal();

  // Save changes immediately
  const day = timetable.closest(".day");
  saveDayToLocal(day);
}

function attachRowEvents(row, isFirst=false){
  const timetable = row.parentElement;
  const day = row.closest(".day");

  // Add row
  row.querySelector(".add").onclick = () => addRow(timetable);

  // Delete row
  const del = row.querySelector(".delete");
  if(isFirst){
    del.disabled=true;
    del.style.opacity="0.3";
    del.style.cursor="not-allowed";
  } else {
    del.onclick = () => {
      if(timetable.querySelectorAll(".row:not(.header)").length <= 1) return;
      row.remove();
      updateTotal();
      saveDayToLocal(day);
    }
  }

  // Save input changes
  row.querySelectorAll("input").forEach(i=>{
    i.addEventListener("input", ()=>{
      updateTotal();
      saveDayToLocal(day);
    });
    if(i.dataset.type==='cost'){
      attachCostInput(row);
    }
  });
}

/* ---------- COST INPUT FORMATTING ---------- */
function attachCostInput(row){
  const input = row.querySelector("input[data-type='cost']");
  if(!input) return;

  input.addEventListener("blur", ()=>{
    let val = parseFloat(input.value.replace(/[^0-9.]/g,''));
    input.value = !isNaN(val) ? `$${val.toFixed(2)}` : '$0.00';
    updateTotal();

    const day = row.closest(".day");
    saveDayToLocal(day);
  });
}

/* ---------- TOTAL COST POPUP ---------- */
function updateTotal(){
  let total = 0;
  document.querySelectorAll(".day").forEach(day=>{
    day.querySelectorAll(".row:not(.header)").forEach(row=>{
      const val = row.querySelector("input[data-type='cost']")?.value.replace("$","");
      if(val && !isNaN(parseFloat(val))) total += parseFloat(val);
    });
  });

  let popup = document.getElementById("total-popup");
  if(!popup){
    popup = document.createElement("div");
    popup.id = "total-popup";
    Object.assign(popup.style,{
      position:"fixed",
      bottom:"20px",
      right:"20px",
      padding:"12px 20px",
      background:"var(--card)",
      color:"var(--text)",
      border:"1px solid var(--border)",
      borderRadius:"12px",
      boxShadow:"0 4px 12px rgba(0,0,0,0.2)",
      fontWeight:"bold",
      zIndex:1000
    });
    document.body.appendChild(popup);
  }
  popup.textContent = "Total Cost: $" + total.toFixed(2);
}

/* ---------- INIT ---------- */
document.querySelectorAll(".day").forEach(day=>{
  loadDayFromLocal(day); // Load saved rows from localStorage
});
updateTotal();

