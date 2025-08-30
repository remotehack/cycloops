import './style.css'

const form = document.querySelector('form')
const posts = document.querySelector('ol')

form?.addEventListener('submit', e => {
  e.preventDefault()

  const data = new FormData(e.target)
  console.log("d", data.get('message'))

})