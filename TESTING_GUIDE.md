# Testing Guide: Popup Positioning Feature

## Prerequisites
1. Build the extension: `npm run build`
2. Load the extension in Chrome:
   - Open `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the `dist` folder

## Test Cases

### Test 1: Extension Icon Click
**Steps:**
1. Navigate to any supported e-commerce site (Amazon, eBay, Walmart, etc.)
2. Click the extension icon in Chrome toolbar
3. **Expected:** Popup appears at top-right corner with semi-transparent overlay
4. **Verify:** Popup is positioned on the page, not anchored to browser icon

### Test 2: Toggle Behavior
**Steps:**
1. With popup open from Test 1
2. Click the extension icon again
3. **Expected:** Popup disappears
4. Click extension icon once more
5. **Expected:** Popup reappears

### Test 3: Close Button
**Steps:**
1. Open popup by clicking extension icon
2. Click the X button in popup header
3. **Expected:** Popup closes smoothly

### Test 4: Overlay Click
**Steps:**
1. Open popup by clicking extension icon
2. Click anywhere on the semi-transparent overlay (outside popup)
3. **Expected:** Popup closes

### Test 5: Product Save Functionality
**Steps:**
1. Navigate to a product page (e.g., Amazon product)
2. Click "Save Secretly" button on the page
3. Wait for "Saved!" confirmation
4. Click extension icon to open popup
5. **Expected:** Saved product appears in the list
6. **Verify:** Product title, price, image, and site are displayed correctly

### Test 6: Remove Product
**Steps:**
1. With popup open and products saved
2. Click "Remove" button on a product
3. **Expected:** Product is removed from list
4. **Verify:** Product count updates in header

### Test 7: View Product
**Steps:**
1. With popup open and products saved
2. Click "View" button on a product
3. **Expected:** New tab opens with product URL

### Test 8: Clear All
**Steps:**
1. With popup open and products saved
2. Click "Clear All" button at bottom
3. Confirm the prompt
4. **Expected:** All products cleared, empty state shown

### Test 9: Responsive Design
**Steps:**
1. Open popup on desktop
2. Resize browser window to mobile size (< 768px)
3. **Expected:** Popup adapts to smaller viewport

### Test 10: Multiple Tabs
**Steps:**
1. Open popup in one tab
2. Switch to another tab
3. Save a product from the second tab
4. Switch back to first tab with popup still open
5. **Expected:** Popup updates automatically with new product

### Test 11: Animation & UX
**Steps:**
1. Click extension icon to open popup
2. **Verify:** Smooth slide-in animation from right
3. **Verify:** Fade-in animation on overlay
4. Close popup with overlay click
5. **Verify:** Smooth animations on close

### Test 12: Z-Index & Overlay
**Steps:**
1. Navigate to a page with lots of content
2. Open popup
3. **Verify:** Popup appears above all page content
4. **Verify:** Overlay covers entire viewport
5. **Verify:** Can't interact with page content while popup is open

## Expected Behavior Summary

✅ Popup appears at top-right corner of viewport
✅ Semi-transparent overlay covers page
✅ Close button (X) visible in header
✅ Clicking overlay or X closes popup
✅ Clicking icon toggles popup on/off
✅ All product management features work
✅ Smooth animations on open/close
✅ Responsive on mobile
✅ Updates in real-time across tabs

## Common Issues & Solutions

**Issue:** Popup doesn't appear
- **Solution:** Ensure you're on a supported e-commerce site
- **Solution:** Check browser console for errors

**Issue:** Popup appears in wrong position
- **Solution:** Clear cache and reload extension

**Issue:** Can't close popup
- **Solution:** Check if overlay click handler is working
- **Solution:** Use X button as alternative

**Issue:** Products not saving
- **Solution:** Verify you're on a product page
- **Solution:** Check storage permissions in manifest

## Manual Testing Checklist

- [ ] Extension icon click opens popup
- [ ] Popup positioned at top-right
- [ ] Overlay visible and clickable
- [ ] Close button works
- [ ] Toggle behavior works
- [ ] Save product functionality works
- [ ] Remove product works
- [ ] View product works
- [ ] Clear all works
- [ ] Animations smooth
- [ ] Responsive design works
- [ ] Real-time updates across tabs
- [ ] No console errors

## Notes

- Original popup.html is no longer used but kept for reference
- All functionality from original popup is preserved
- Follow existing pattern from tryonImageUploadPopup
