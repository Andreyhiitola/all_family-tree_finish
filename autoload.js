console.log("🔄 Автозагрузка JSON");
fetch("data/family-data.json")
.then(r => r.json())
.then(data => {
  localStorage.setItem("familyTreeData", JSON.stringify(data));
  window.people = data;
  document.getElementById("total-people").textContent = data.length;
  if (typeof window.refreshAll === "function") window.refreshAll();
  console.log("✅ Загружено", data.length, "человек");
});
