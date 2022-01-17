const {basename} = require('path')
const {ipcRenderer} = require('electron')
const {PropertyType} = require('../lib/uexport')
const txtRes = require('../lib/text-resource.json')
const pkg = require('../package.json')

/**
 * @typedef {{$tag: string} & Record<string, string | number | string[] | number[]>} SparseEntry
 */

/** @type {import('../lib/upackage').IUPackage} */
let upackage

window.addEventListener('DOMContentLoaded', () => {
  setTitle()
  setupOpenAndSaveButtons()

  document
    .getElementById('show-txt-ids-checkbox')
    .addEventListener('change', event => {
      const entries = document.getElementById('entries')
      if (event.target.checked) {
        entries.classList.remove('txt-values')
        entries.classList.add('txt-ids')
      } else {
        entries.classList.remove('txt-ids')
        entries.classList.add('txt-values')
      }
    })

  setupFind()
})

function setTitle() {
  const nameAndVersion = `${pkg.description} v${pkg.version}`
  if (upackage != null) {
    document.title = `${basename(upackage.uasset.filename)} - ${nameAndVersion}`
  } else {
    document.title = nameAndVersion
  }
}

function setupOpenAndSaveButtons() {
  document
    .getElementById('open-file-button')
    .addEventListener('click', openUPackage)

  document
    .getElementById('save-file-button')
    .addEventListener('click', saveUPackage)
}

function openUPackage() {
  ipcRenderer.send('open-upackage')
}

ipcRenderer.on('upackage-opened', (event, json) => {
  loadUPackage(json)
})

/**
 * @param {string} json
 */
function loadUPackage(json) {
  upackage = JSON.parse(json)
  loadEntries(upackage.uexp.entries)
  setTitle()
  document.getElementById('save-file-button').disabled = false
}

/**
 * @param {SparseEntry[]} entries
 */
function loadEntries(entries) {
  const uexp = upackage.uexp
  const table = document.getElementById('entries')
  const thead = document.createElement('thead')
  const tr = document.createElement('tr')

  const indexTH = document.createElement('th')
  indexTH.innerText = '#'
  tr.appendChild(indexTH)

  const tagTH = document.createElement('th')
  tagTH.innerText = 'Tag'
  tr.appendChild(tagTH)

  for (const prop of uexp.props) {
    const th = document.createElement('th')
    th.innerText = prop.name
    tr.appendChild(th)
  }

  thead.appendChild(tr)

  const tbody = document.createElement('tbody')

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const originalEntry = uexp.entries[i]

    const tr = document.createElement('tr')

    const indexTH = document.createElement('th')
    indexTH.innerText = i
    tr.appendChild(indexTH)

    const tagTH = document.createElement('th')
    tagTH.innerText = entry.$tag
    tr.appendChild(tagTH)

    for (const prop of uexp.props) {
      const td = document.createElement('td')
      const value =
        entry[prop.name] != null ? entry[prop.name] : originalEntry[prop.name]
      const originalValue = String(originalEntry[prop.name])

      if (prop.name.endsWith('_Array')) {
        for (let j = 0; j < value.length; j++) {
          const element = value[j]
          const originalElement = String(originalEntry[prop.name][j])
          const span = document.createElement('span')
          span.classList.add('element')
          span.dataset.dataType = String(prop.type)

          switch (prop.type) {
            case PropertyType.BOOLEAN:
            case PropertyType.BYTE:
            case PropertyType.BOOLEAN_BYTE:
            case PropertyType.UINT16:
            case PropertyType.INT32:
            case PropertyType.FLOAT:
              span.innerText = String(element)
              span.contentEditable = 'true'

              span.addEventListener('focus', () => {
                getSelection().selectAllChildren(span)
              })

              span.addEventListener('blur', () => {
                if (span.innerText !== originalElement) {
                  span.dataset.isDirty = ''

                  let number
                  switch (Number(span.dataset.dataType)) {
                    case PropertyType.BOOLEAN:
                    case PropertyType.BYTE:
                    case PropertyType.BOOLEAN_BYTE:
                      number = Number(span.innerText)
                      if (isNaN(number)) {
                        span.classList.add('invalid')
                        span.title = 'Value must be a number'
                      } else if (number < 0x0 || number > 0x0ff) {
                        span.classList.add('invalid')
                        span.title = 'Value must be between 0 and 255'
                      } else {
                        span.classList.remove('invalid')
                        span.removeAttribute('title')
                      }
                      break
                    case PropertyType.UINT16:
                      number = Number(span.innerText)
                      if (isNaN(number)) {
                        span.classList.add('invalid')
                        span.title = 'Value must be a number'
                      } else if (number < -32768 || number > 32767) {
                        span.classList.add('invalid')
                        span.title = 'Value must be between -32,768 and 32,768'
                      } else {
                        span.classList.remove('invalid')
                        span.removeAttribute('title')
                      }
                      break
                    case PropertyType.INT32:
                      number = Number(span.innerText)
                      if (isNaN(number)) {
                        span.classList.add('invalid')
                        span.title = 'Value must be a number'
                      } else if (number < -2147483648 || number > 2147483647) {
                        span.classList.add('invalid')
                        span.title =
                          'Value must be between -2,147,483,648 and 2,147,483,647'
                      } else {
                        span.classList.remove('invalid')
                        span.removeAttribute('title')
                      }
                      break
                  }
                } else {
                  delete span.dataset.isDirty
                  span.classList.remove('invalid')
                  span.removeAttribute('title')
                }
              })
              break

            case PropertyType.STRING:
              if (txtRes[element] != null) {
                const txtID = document.createElement('span')
                txtID.classList.add('txt-id')
                txtID.innerText = element
                txtID.title = txtRes[element]
                span.appendChild(txtID)

                const txtValue = document.createElement('span')
                txtValue.classList.add('txt-value')
                txtValue.innerText = txtRes[element]
                txtValue.title = element
                span.appendChild(txtValue)
              } else {
                span.innerText = element
              }

              td.classList.add('disabled')
              break

            case PropertyType.NAME:
              if (txtRes[element] != null) {
                const txtID = document.createElement('span')
                txtID.classList.add('txt-id')
                txtID.innerText = element
                txtID.title = txtRes[element]
                span.appendChild(txtID)

                const txtValue = document.createElement('span')
                txtValue.classList.add('txt-value')
                txtValue.innerText = txtRes[element]
                txtValue.title = element
                span.appendChild(txtValue)
              } else {
                span.innerText = element
              }

              span.dataset.value = element
              span.tabIndex = 0

              span.addEventListener('focus', () => {
                const showTxtValues = document
                  .getElementById('entries')
                  .classList.contains('txt-values')

                const select = document.createElement('select')

                for (const name of upackage.uasset.names) {
                  const option = document.createElement('option')
                  option.value = name

                  if (txtRes[name] != null) {
                    if (showTxtValues) {
                      option.label = txtRes[name]
                      option.title = name
                    } else {
                      option.label = name
                      option.title = txtRes[name]
                    }
                  } else {
                    option.label = name
                  }

                  select.appendChild(option)
                }

                select.value = span.dataset.value

                select.addEventListener('blur', () => {
                  const selectedValue = select.value

                  if (selectedValue !== originalElement) {
                    span.dataset.isDirty = ''
                  } else {
                    delete span.dataset.isDirty
                  }

                  if (txtRes[selectedValue] != null) {
                    span.replaceChildren()

                    const txtID = document.createElement('span')
                    txtID.classList.add('txt-id')
                    txtID.innerText = selectedValue
                    txtID.title = txtRes[selectedValue]
                    span.appendChild(txtID)

                    const txtValue = document.createElement('span')
                    txtValue.classList.add('txt-value')
                    txtValue.innerText = txtRes[selectedValue]
                    txtValue.title = selectedValue
                    span.appendChild(txtValue)
                  } else {
                    span.innerText = selectedValue
                  }

                  span.dataset.value = selectedValue
                  span.tabIndex = 0
                })

                span.replaceChildren(select)
                span.tabIndex = -1
                select.focus()
              })
              break

            default:
              span.innerText = String(value)
              td.classList.add('disabled')
          }

          td.appendChild(span)

          if (j !== value.length - 1) {
            td.appendChild(document.createTextNode(', '))
          }
        }
      } else {
        td.dataset.dataType = String(prop.type)

        switch (prop.type) {
          case PropertyType.BOOLEAN:
          case PropertyType.BYTE:
          case PropertyType.BOOLEAN_BYTE:
          case PropertyType.UINT16:
          case PropertyType.INT32:
          case PropertyType.FLOAT:
            td.innerText = String(value)
            td.contentEditable = 'true'

            td.addEventListener('focus', () => {
              getSelection().selectAllChildren(td)
            })

            td.addEventListener('blur', () => {
              if (td.innerText !== originalValue) {
                td.dataset.isDirty = ''

                let number
                switch (Number(td.dataset.dataType)) {
                  case PropertyType.BOOLEAN:
                  case PropertyType.BYTE:
                  case PropertyType.BOOLEAN_BYTE:
                    number = Number(td.innerText)
                    if (isNaN(number)) {
                      td.classList.add('invalid')
                      td.title = 'Value must be a number'
                    } else if (number < 0x0 || number > 0x0ff) {
                      td.classList.add('invalid')
                      td.title = 'Value must be between 0 and 255'
                    } else {
                      td.classList.remove('invalid')
                      td.removeAttribute('title')
                    }
                    break
                  case PropertyType.UINT16:
                    number = Number(td.innerText)
                    if (isNaN(number)) {
                      td.classList.add('invalid')
                      td.title = 'Value must be a number'
                    } else if (number < -32768 || number > 32767) {
                      td.classList.add('invalid')
                      td.title = 'Value must be between -32,768 and 32,768'
                    } else {
                      td.classList.remove('invalid')
                      td.removeAttribute('title')
                    }
                    break
                  case PropertyType.INT32:
                    number = Number(td.innerText)
                    if (isNaN(number)) {
                      td.classList.add('invalid')
                      td.title = 'Value must be a number'
                    } else if (number < -2147483648 || number > 2147483647) {
                      td.classList.add('invalid')
                      td.title =
                        'Value must be between -2,147,483,648 and 2,147,483,647'
                    } else {
                      td.classList.remove('invalid')
                      td.removeAttribute('title')
                    }
                    break
                }
              } else {
                delete td.dataset.isDirty
                td.classList.remove('invalid')
                td.removeAttribute('title')
              }
            })
            break

          case PropertyType.STRING:
            if (txtRes[value] != null) {
              const txtID = document.createElement('span')
              txtID.classList.add('txt-id')
              txtID.innerText = value
              txtID.title = txtRes[value]
              td.appendChild(txtID)

              const txtValue = document.createElement('span')
              txtValue.classList.add('txt-value')
              txtValue.innerText = txtRes[value]
              txtValue.title = value
              td.appendChild(txtValue)
            } else {
              td.innerText = value
            }

            td.classList.add('disabled')
            break

          case PropertyType.NAME:
            if (txtRes[value] != null) {
              const txtID = document.createElement('span')
              txtID.classList.add('txt-id')
              txtID.innerText = value
              txtID.title = txtRes[value]
              td.appendChild(txtID)

              const txtValue = document.createElement('span')
              txtValue.classList.add('txt-value')
              txtValue.innerText = txtRes[value]
              txtValue.title = value
              td.appendChild(txtValue)
            } else {
              td.innerText = value
            }

            td.dataset.value = value
            td.tabIndex = 0

            td.addEventListener('focus', () => {
              const showTxtValues = document
                .getElementById('entries')
                .classList.contains('txt-values')

              const select = document.createElement('select')

              for (const name of upackage.uasset.names) {
                const option = document.createElement('option')
                option.value = name

                if (txtRes[name] != null) {
                  if (showTxtValues) {
                    option.label = txtRes[name]
                    option.title = name
                  } else {
                    option.label = name
                    option.title = txtRes[name]
                  }
                } else {
                  option.label = name
                }

                select.appendChild(option)
              }

              select.value = td.dataset.value

              select.addEventListener('blur', () => {
                const selectedValue = select.value

                if (selectedValue !== originalValue) {
                  td.dataset.isDirty = ''
                } else {
                  delete td.dataset.isDirty
                }

                if (txtRes[selectedValue] != null) {
                  td.replaceChildren()

                  const txtID = document.createElement('span')
                  txtID.classList.add('txt-id')
                  txtID.innerText = selectedValue
                  txtID.title = txtRes[selectedValue]
                  td.appendChild(txtID)

                  const txtValue = document.createElement('span')
                  txtValue.classList.add('txt-value')
                  txtValue.innerText = txtRes[selectedValue]
                  txtValue.title = selectedValue
                  td.appendChild(txtValue)
                } else {
                  td.innerText = selectedValue
                }

                td.dataset.value = selectedValue
                td.tabIndex = 0
              })

              td.replaceChildren(select)
              td.tabIndex = -1
              select.focus()
            })
            break

          default:
            td.innerText = String(value)
            td.classList.add('disabled')
        }
      }

      td.addEventListener('keydown', event => {
        if (event.key === 'ArrowDown' || event.key === 'Enter') {
          event.preventDefault()
          const nextTR = td.parentElement.nextElementSibling
          if (nextTR != null) {
            const nextTD = nextTR.cells.item(td.cellIndex)
            nextTD.focus()
            if (td.contentEditable === 'true') {
              getSelection().selectAllChildren(nextTD)
            }
          }
        } else if (event.key === 'ArrowUp') {
          event.preventDefault()
          const prevTR = td.parentElement.previousElementSibling
          if (prevTR != null) {
            const prevTD = prevTR.cells.item(td.cellIndex)
            prevTD.focus()
            if (td.contentEditable === 'true') {
              getSelection().selectAllChildren(prevTD)
            }
          }
        }
      })

      tr.appendChild(td)
    }

    tbody.appendChild(tr)
  }

  table.replaceChildren(thead, tbody)
}

/**
 * @typedef GetEntriesOptions
 * @property {boolean} dirtyOnly
 */

/**
 * @param {GetEntriesOptions} options
 */
function getEntries({dirtyOnly} = {dirtyOnly: true}) {
  /** @type {SparseEntry[]} */
  const entries = []
  /** @type {HTMLTableElement} */
  const table = document.getElementById('entries')
  const tbody = table.tBodies.item(0)
  for (let i = 0; i < tbody.rows.length; i++) {
    const tr = tbody.rows.item(i)
    const tagTD = tr.cells.item(1)
    const entry = {$tag: tagTD.innerText}
    for (let j = 2; j < tr.cells.length; j++) {
      const td = tr.cells.item(j)
      const prop = upackage.uexp.props[j - 2]
      if (
        !prop.name.endsWith('_Array') &&
        (!dirtyOnly || td.dataset.isDirty != null)
      ) {
        let value
        let txtID
        switch (prop.type) {
          case PropertyType.BOOLEAN:
          case PropertyType.BYTE:
          case PropertyType.BOOLEAN_BYTE:
          case PropertyType.UINT16:
          case PropertyType.INT32:
          case PropertyType.FLOAT:
            value = Number(td.innerText)
            break
          case PropertyType.STRING:
            txtID = td.querySelector('.txt-id')
            if (txtID != null) {
              value = txtID.innerText
            } else {
              value = td.innerText
            }
            break
          case PropertyType.NAME:
            value = td.dataset.value
            break
          default:
            value = td.innerText
        }

        entry[prop.name] = value
      } else {
        const spans = td.querySelectorAll('.element')
        let array = dirtyOnly ? undefined : []
        for (let k = 0; k < spans.length; k++) {
          const span = spans.item(k)
          if (!dirtyOnly || span.dataset.isDirty != null) {
            if (array == null) {
              array = Array(upackage.uexp.entries[i][prop.name].length)
            }

            let element
            let txtID
            switch (prop.type) {
              case PropertyType.BOOLEAN:
              case PropertyType.BYTE:
              case PropertyType.BOOLEAN_BYTE:
              case PropertyType.UINT16:
              case PropertyType.INT32:
              case PropertyType.FLOAT:
                element = Number(span.innerText)
                break
              case PropertyType.STRING:
                txtID = span.querySelector('.txt-id')
                if (txtID != null) {
                  element = txtID.innerText
                } else {
                  element = td.innerText
                }
                break
              case PropertyType.NAME:
                element = span.dataset.value
                break
              default:
                element = span.innerText
            }

            array[k] = element
          }
        }

        entry[prop.name] = array
      }
    }

    entries.push(entry)
  }

  return entries
}

ipcRenderer.on('save-upackage', saveUPackage)

function saveUPackage() {
  // Focus away from entries to ensure they are saved.
  document.getElementById('save-file-button').focus()
  const entries = getEntries()
  ipcRenderer.send('upackage-saved', entries)
}

ipcRenderer.on('export-csv', exportCSV)

function exportCSV() {
  // Focus away from entries to ensure they are saved.
  document.getElementById('save-file-button').focus()
  const entries = getEntries({dirtyOnly: false})
  ipcRenderer.send('csv-exported', entries)
}

ipcRenderer.on('upackage-saved', (event, filename) => {
  upackageSaved(filename)
})

/**
 * @param {string} filename
 */
function upackageSaved(filename) {
  const toast = document.getElementById('save-file-toast')
  const toastBody = toast.querySelector('.toast-body')
  toastBody.innerText = `${basename(filename)} has been saved.`
  toast.classList.add('show')

  const closeButton = toast.querySelector('.btn-close')
  closeButton.addEventListener('click', () => {
    toast.classList.remove('show')
  })
}

function setupFind() {
  const found = []
  let foundIndex = 0
  /** @type {HTMLTableElement} */
  const entries = document.getElementById('entries')
  const form = document.getElementById('find-form')
  const textbox = document.getElementById('find-textbox')
  const indexSpan = document.getElementById('find-index')
  const totalSpan = document.getElementById('find-total')
  const prevButton = document.getElementById('find-prev-button')
  const closeButton = document.getElementById('find-close-button')

  function findAll() {
    const regexp = new RegExp(escapeRegExp(textbox.value), 'i')
    found.length = 0
    for (const row of entries.rows) {
      for (const cell of row.cells) {
        cell.classList.remove('current')
        const isFound = textbox.value.length > 0 && regexp.test(cell.innerText)
        if (isFound) {
          cell.classList.add('found')
          found.push(cell)
        } else {
          cell.classList.remove('found')
        }
      }

      totalSpan.innerText = String(found.length)

      if (found.length > 0) {
        setFound()
      } else {
        indexSpan.innerText = String(0)
      }
    }
  }

  function findNext() {
    if (found.length > 1) {
      found[foundIndex].classList.remove('current')
      if (++foundIndex === found.length) {
        foundIndex = 0
      }

      setFound()
    }
  }

  function findPrev() {
    if (found.length > 1) {
      found[foundIndex].classList.remove('current')
      if (--foundIndex < 0) {
        foundIndex = found.length - 1
      }

      setFound()
    }
  }

  function setFound() {
    indexSpan.innerText = String(foundIndex + 1)
    const current = found[foundIndex]
    current.classList.add('current')
    setImmediate(() => {
      current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'center',
      })
    })
  }

  function close() {
    const tbody = entries.tBodies.item(0)
    if (tbody != null) {
      for (let i = 0; i < tbody.rows.length; i++) {
        const row = tbody.rows.item(i)
        for (let j = 0; j < row.cells.length; j++) {
          const cell = row.cells.item(j)
          cell.classList.remove('current')
          cell.classList.remove('found')
        }
      }
    }

    form.classList.remove('d-flex')
    form.classList.add('d-none')
  }

  ipcRenderer.on('find', () => {
    form.classList.remove('d-none')
    form.classList.add('d-flex')
    findAll()
    textbox.focus()
    textbox.select()
  })

  form.addEventListener('submit', event => {
    event.preventDefault()
    findNext()
  })

  form.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      close()
    }
  })

  form.addEventListener('focusout', () => {
    setImmediate(() => {
      if (
        !form.contains(document.activeElement) &&
        (document.activeElement.contentEditable === 'true' ||
          document.activeElement.tagName === 'SELECT')
      ) {
        close()
      }
    })
  })

  textbox.addEventListener('input', () => {
    foundIndex = 0
    findAll()
  })

  textbox.addEventListener('keydown', event => {
    if (event.shiftKey) {
      if (event.key === 'Enter') {
        event.preventDefault()
        findPrev()
      } else if (event.key === 'Tab') {
        event.preventDefault()
        closeButton.focus()
      }
    }
  })

  prevButton.addEventListener('click', findPrev)

  closeButton.addEventListener('click', close)

  closeButton.addEventListener('keydown', event => {
    if (!event.shiftKey && event.key === 'Tab') {
      event.preventDefault()
      textbox.focus()
    }
  })
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$0')
}
