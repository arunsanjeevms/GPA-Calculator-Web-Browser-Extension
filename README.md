<div align="center">

# CGPA Calculator Chrome Extension


**Made by Arun Sanjeev**

Calculate and display your CGPA directly on the [camsmkce.in](https://camsmkce.in/) ERP Grades pages and Result Publishing Page.</center>

<div align="center">

  </a>
  <a href="mailto:msarunsanjeev@gmail.com" target="_blank">
    <img src="https://img.shields.io/static/v1?message=Gmail&logo=gmail&label=&color=D14836&logoColor=white&labelColor=&style=for-the-badge" height="25" alt="gmail logo"  />
  </a>
  
  
  <a href="https://www.linkedin.com/in/arunsanjeev/" target="_blank">
    <img src="https://img.shields.io/static/v1?message=LinkedIn&logo=linkedin&label=&color=0077B5&logoColor=white&labelColor=&style=for-the-badge" height="25" alt="linkedin logo"  />
    
  </a>


  

  
  <a href="https://www.instagram.com/arun_sanjeev._/" target="_blank">
    <img src="https://img.shields.io/static/v1?message=Instagram&logo=instagram&label=&color=E4405F&logoColor=white&labelColor=&style=for-the-badge" height="25" alt="instagram logo"  />
    
    

    
  </a>
  
    
   <a href="https://medium.com/@msarunsanjeev/" target="_blank">
    <img src="https://img.shields.io/static/v1?message=Medium&logo=Medium&label=&color=black&logoColor=white&labelColor=&style=for-the-badge" height="25" alt="Medium logo"  />
    
  </a>
  
</div>

<p align="center">
  <img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%">
</p>


</div>

## Features

- Automatically detects your grades table and extracts **semester, credit, and grade**.
- Computes **overall CGPA** and **semester-wise GPA**.
- Floating **overlay on the ERP page** (can be dismissed).
- Popup UI showing **breakdown** and **raw table rows**.
- Stores the **last computed data** in Chrome local storage for quick access.

---

## Installation (Unpacked)

1. Open Chrome and navigate to `chrome://extensions/`.
2. Toggle **Developer mode** (top-right corner).
3. Click **Load unpacked** and select the folder containing this extension.
4. Visit your grades page on [camsmkce.in](https://camsmkce.in/).
5. The overlay will appear automatically; click the extension icon to view detailed popup info.

---

## Development

- Changes to `manifest.json` require clicking **Reload** on the extension card.
- For JS, HTML, or CSS updates, a simple page reload is sufficient.
- Use **console logs** for debugging content scripts.

---

## Adjusting Column Indexes

If your ERP grades table structure changes:

1. Open `content.js`.
2. Look for the `parseTable()` function.
3. Adjust the **column indices** for semester, credits, and grade as needed.

---

## Security & Privacy

- No network requests are made.
- All data stays **local** in Chrome storage.
- You can safely remove or modify storage logic as per your requirements.

---

## Screenshots

### Extension Overlay on Grades Page
![Extension View](Screenshots/1.png)

### Extension in Menu Bar
![Menu Bar view](Screenshots/3.png)

### Popup
![popup](Screenshots/4.png)

### GPA and Credits
![Result Page](Screenshots/5.png)

---

## Contributing

1. Fork this repository.
2. Make your changes.
3. Submit a pull request.

---

## License

MIT License – free to use and modify.
