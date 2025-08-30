import './style.css'
import Dexie from 'dexie';


const db = new Dexie('Cycleoops');

// Declare tables, IDs and indexes
db.version(1).stores({
  notes: '++id, time, text, lat, lon'
});

const form = document.querySelector('form')!
const posts = document.querySelector('ol')!


async function update() {
  const notes = await db.notes
    .orderBy("time")
    .reverse()
    .toArray();

    console.log(notes)

  posts.innerHTML = ''

  for(const note of notes) {

    const li = document.createElement('li')

    li.innerText = JSON.stringify(note);

    posts.appendChild(li)


  }
 
}

update()

form?.addEventListener('submit', async e => {
  e.preventDefault()

  const data = new FormData(e.target)
  const text = data.get("message")
  const time = Date.now()


  const [lat, lon] = await new Promise((resolve, reject) => {
    
    navigator.geolocation.getCurrentPosition((position) => {
      console.log(position.coords);
      resolve([position.coords.latitude, position.coords.longitude])


    }, () => {

      resolve([0,0])

    });

    
  })


  const noteId = await db.notes.add({
    time,
    text,
    lat,
    lon
  })

  console.log(noteId)


  update()


})