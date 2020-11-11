const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector("input");
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");

// Templetes
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
  "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML

// options
const {username,room}=Qs.parse(location.search,{ignoreQueryPrefix: true})
const autoscroll = ()=>{
  // New message element
  const $newMessage = $messages.lastElementChild
  // Height of the new Message
  const newMessageStyles = getComputedStyle($newMessage)
  const newMessageMargin = parseInt(newMessageStyles.marginBottom)
  const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
  
  // Visible Height
  const visibleHeight = $messages.offsetHeight
  // Height of messages container
  const containerHeight = $messages.scrollHeight
  // how far hav i scrolled?
  const scroolOffset = $messages.scrollTop + visibleHeight
  if (containerHeight - newMessageHeight <= scroolOffset) {
    $messages.scrollTop = $messages.scrollHeight
  }
}

socket.on("message", (message) => {
  console.log(message);
  const html = Mustache.render(messageTemplate, {
    username:message.username,
    message: message.text,
    createdAt: moment(message.createdAt).format("h:mm a"),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll()
});

socket.on("locationMessage", (location) => {
  console.log(location);
  const html = Mustache.render(locationMessageTemplate, {
    username:location.username,
    url: location.url,
    createdAt: moment(location.createdAt).format('h:mm a'),
  });
  $messages.insertAdjacentHTML("beforeend", html);
  autoscroll()
});

socket.on('roomData',({room,users})=>{
  const html = Mustache.render(sidebarTemplate,{room,users})
  document.querySelector('#sidebar').innerHTML = html
})
$messageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  //   disable button
  $messageFormButton.setAttribute("disabled", "disabled");
  const message = e.target.elements.message.value;
  socket.emit("sendMessage", message, (error) => {
    // enable button
    $messageFormButton.removeAttribute("disabled");
    $messageFormInput.value = "";
    $messageFormInput.focus();
    if (error) {
      alert(error)
    }
    console.log("Message Delivered");
  });
});
document.querySelector("#send-location").addEventListener("click", () => {
  if (!navigator.geolocation) {
    return alert("Geolocation is not supported by your browser");
  }
  //   disable button
  $sendLocationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((position) => {
    socket.emit(
      "sendLocation",
      {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      },
      () => {
        $sendLocationButton.removeAttribute("disabled");
        console.log("location shared");
      }
    );
  });
});

socket.emit('join',{username,room},(error)=>{
  if (error) {
    alert(error)
    location.href = '/'
  }
})