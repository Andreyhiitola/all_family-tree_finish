window.exportPeopleToJson = function(people) {
  const dataStr = JSON.stringify(people, null, 2)
  const blob = new Blob([dataStr], { type: 'application/json' })
  saveAs(blob, `семейное_древо_${new Date().toISOString().split('T')[0]}.json`)
}
