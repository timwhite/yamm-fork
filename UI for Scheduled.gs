function startingPageforScheduledMerge(){
 var app = UiApp.createApplication().setTitle('Scheduled mail merge').setWidth(602).setHeight(400);
  var mainPanel = app.createVerticalPanel().setId('mainPanel');
  mainPanel.setStyleAttribute('border', '1px solid #C0C0C0').setWidth(600).setHeight(400);
  var infoPanel = app.createVerticalPanel().setId('infoPanel');
  var info = app.createLabel('Use this option to notify people with a reminder');
  mainPanel.add(info);
  mainPanel.setCellHorizontalAlignment(info, UiApp.HorizontalAlignment.CENTER);
  var buttonsPanel = app.createHorizontalPanel().setStyleAttribute('margin', '20px').setWidth(500);
  var closeButton = app.createButton('Close', app.createServerHandler('close_'));
  var nextButton = app.createButton('Next', app.createServerHandler('selectColumns_')).setId('nextButton');
  buttonsPanel.setId('buttonsPanel').add(closeButton).add(nextButton);
  app.add(mainPanel);
  mainPanel.add(buttonsPanel);
  mainPanel.setCellHorizontalAlignment(buttonsPanel, UiApp.HorizontalAlignment.CENTER);
  buttonsPanel.setCellHorizontalAlignment(nextButton, UiApp.HorizontalAlignment.RIGHT);
  ss.show(app);
}

function selectColumns_(){
  var app = UiApp.getActiveApplication();
  var mainPanel = app.getElementById('mainPanel').clear();
  var dataSheet = ss.getActiveSheet();
  var lastColumn = dataSheet.getLastColumn();
  var headers = dataSheet.getRange(1, 1, 1, lastColumn).getValues();
  var listBox1 = app.createListBox().addItem('Select...');
  var listBox2 = app.createListBox().addItem('Select...');
  for (var i = 0; i < headers[0].length; i++) {
    listBox1.addItem(headers[0][i]);
    listBox2.addItem(headers[0][i]);
  }
    var grid = app.createGrid(2, 2);
    grid.setWidget(0, 0, app.createLabel("Which column contains the recipients?"));
    grid.setWidget(0, 1, listBox1.setName('emailColumn')).setStyleAttribute('marginLeft', 10);
    grid.setWidget(1, 0, app.createLabel("Which column contains the sending dates ?"));
    grid.setWidget(1, 1, listBox2.setName('dateColumn')).setStyleAttribute('marginLeft', 10);
    grid.setStyleAttribute('marginTop', '50px');
    mainPanel.add(grid);
    mainPanel.setCellHorizontalAlignment(grid, UiApp.HorizontalAlignment.CENTER);
  var buttonPanel = app.getElementById('buttonsPanel');
  var closeButton = app.createButton('Close', app.createServerHandler('close_'));
  var nextButton = app.createButton('Next', app.createServerHandler('selectOtherInfoForScheduledMerge_').addCallbackElement(grid)).setId('nextButton');
  buttonsPanel.setId('buttonsPanel').add(closeButton).add(nextButton);
  buttonsPanel.setCellHorizontalAlignment(nextButton, UiApp.HorizontalAlignment.RIGHT);
  ss.show(app);
}

function selectOtherInfoForScheduledMerge_(e){
  var app = UiApp.getActiveApplication();
  var mainPanel = app.getElementById('mainPanel').clear();
  selectDraftInGmail_(app, true, e);
  var buttonPanel = app.getElementById('buttonsPanel');
  mainPanel.add(buttonPanel.remove(app.getElementById('nextButton')));
  mainPanel.setCellHorizontalAlignment(buttonPanel, UiApp.HorizontalAlignment.CENTER);
  return app;
}

function scheduleMerge_(e){
}

