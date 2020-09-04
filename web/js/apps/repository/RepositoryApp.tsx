import * as React from 'react';
import {IEventDispatcher} from '../../reactor/SimpleReactor';
import {IDocInfo} from 'polar-shared/src/metadata/IDocInfo';
import {PersistenceLayerManager} from '../../datastore/PersistenceLayerManager';
import {BrowserRouter, Route, Switch} from 'react-router-dom';
import {RepoDocMetaManager} from '../../../../apps/repository/js/RepoDocMetaManager';
import {RepoDocMetaLoader} from '../../../../apps/repository/js/RepoDocMetaLoader';
import WhatsNewScreen
    from '../../../../apps/repository/js/whats_new/WhatsNewScreen';
import {StatsScreen} from '../../../../apps/repository/js/stats/StatsScreen';
import {PremiumScreen} from '../../../../apps/repository/js/splash/splashes/premium/PremiumScreen';
import {SupportScreen} from '../../../../apps/repository/js/support/SupportScreen';
import {AuthRequired} from "../../../../apps/repository/js/AuthRequired";
import {
    PersistenceLayerApp,
    PersistenceLayerContext
} from "../../../../apps/repository/js/persistence_layer/PersistenceLayerApp";
import {InviteScreen} from "../../../../apps/repository/js/invite/InviteScreen";
import {AccountControlSidebar} from "../../../../apps/repository/js/AccountControlSidebar";
import {ReactRouters} from "../../react/router/ReactRouters";
import {Cached} from '../../react/Cached';
import {SettingsScreen} from "../../../../apps/repository/js/configure/settings/SettingsScreen";
import {DeviceScreen} from "../../../../apps/repository/js/device/DeviceScreen";
import {App} from "./AppInitializer";
import {Callback} from "polar-shared/src/util/Functions";
import {MUIRepositoryRoot} from "../../mui/MUIRepositoryRoot";
import {DocRepoScreen2} from "../../../../apps/repository/js/doc_repo/DocRepoScreen2";
import {DocRepoStore2} from "../../../../apps/repository/js/doc_repo/DocRepoStore2";
import {DocRepoSidebarTagStore} from "../../../../apps/repository/js/doc_repo/DocRepoSidebarTagStore";
import {AnnotationRepoSidebarTagStore} from "../../../../apps/repository/js/annotation_repo/AnnotationRepoSidebarTagStore";
import {AnnotationRepoStore2} from "../../../../apps/repository/js/annotation_repo/AnnotationRepoStore";
import {AnnotationRepoScreen2} from "../../../../apps/repository/js/annotation_repo/AnnotationRepoScreen2";
import {ReviewRouter} from "../../../../apps/repository/js/reviewer/ReviewerRouter";
import {PersistentRoute} from "./PersistentRoute";
import {LogoutDialog} from "../../../../apps/repository/js/LogoutDialog";
import {LoginScreen} from "../../../../apps/repository/js/login/LoginScreen";
import {UserTagsProvider} from "../../../../apps/repository/js/persistence_layer/UserTagsProvider2";
import {DocMetaContextProvider} from "../../annotation_sidebar/DocMetaContextProvider";
import {DocViewerDocMetaLookupContextProvider} from "../../../../apps/doc/src/DocViewerDocMetaLookupContextProvider";
import {DocViewerStore} from "../../../../apps/doc/src/DocViewerStore";
import {DocFindStore} from "../../../../apps/doc/src/DocFindStore";
import {AnnotationSidebarStoreProvider} from "../../../../apps/doc/src/AnnotationSidebarStore";
import {DocViewer} from "../../../../apps/doc/src/DocViewer";
import {Preconditions} from "polar-shared/src/Preconditions";
import {RepositoryRoot} from "./RepositoryRoot";
import {AddFileDropzoneScreen} from './upload/AddFileDropzoneScreen';
import {AnkiSyncController} from "../../controller/AnkiSyncController";
import {ErrorScreen} from "../../../../apps/repository/js/ErrorScreen";
import {ListenablePersistenceLayerProvider} from "../../datastore/PersistenceLayer";
import isEqual from 'react-fast-compare';
import {RepoHeader3} from "../../../../apps/repository/js/repo_header/RepoHeader3";
import {RepoFooter} from "../../../../apps/repository/js/repo_footer/RepoFooter";
import {MUIDialogController} from "../../mui/dialogs/MUIDialogController";
import {UseLocationChangeStoreProvider} from '../../../../apps/doc/src/annotations/UseLocationChangeStore';
import {UseLocationChangeRoot} from "../../../../apps/doc/src/annotations/UseLocationChangeRoot";
import {BrowserTabs} from "../../chrome_tabs/BrowserTabs";
import {useBrowserTabsCallbacks, useBrowserTabsStore} from "../../chrome_tabs/BrowserTabsStore";
import {DocViewerAppURLs} from "../../../../apps/doc/src/DocViewerAppURLs";
import {useLocation} from "react-router-dom";
import {usePrefs} from "../../../../apps/repository/js/persistence_layer/PrefsHook";

interface IProps {
    readonly app: App;
    readonly repoDocMetaManager: RepoDocMetaManager;
    readonly repoDocMetaLoader: RepoDocMetaLoader;
    readonly persistenceLayerManager: PersistenceLayerManager;
    readonly updatedDocInfoEventDispatcher: IEventDispatcher<IDocInfo>;
    readonly onFileUpload: Callback;
}

interface RepositoryDocViewerScreenProps {
    readonly persistenceLayerProvider: ListenablePersistenceLayerProvider;
    readonly url: string
}

export const RepositoryDocViewerScreen = React.memo((props: RepositoryDocViewerScreenProps) => {

/*
    const prefs = usePrefs();

    if (! prefs.value) {
        return null;
    }

    const mode = prefs.value!.get('tabbed');
    (window as any).tabbed = mode;
*/

    return (
      <AuthRequired>
          <PersistenceLayerContext.Provider value={{persistenceLayerProvider: props.persistenceLayerProvider}}>
              <UserTagsProvider>
                  <DocMetaContextProvider>
                      <DocViewerDocMetaLookupContextProvider>
                          <DocViewerStore>
                              <DocFindStore>
                                  <AnnotationSidebarStoreProvider>
                                      <DocViewer url={props.url}/>
                                  </AnnotationSidebarStoreProvider>
                              </DocFindStore>
                          </DocViewerStore>
                      </DocViewerDocMetaLookupContextProvider>
                  </DocMetaContextProvider>
              </UserTagsProvider>
          </PersistenceLayerContext.Provider>
      </AuthRequired>
  );
}, isEqual);

export const RepositoryApp = (props: IProps) => {

    const {app, repoDocMetaManager, repoDocMetaLoader, persistenceLayerManager} = props;

    Preconditions.assertPresent(app, 'app');

    const RepositoryDocViewers = () => {
      // Get tabStore
      const { activeTab, tabs, tabContents } = useBrowserTabsStore([
        "activeTab",
        "tabs",
        "tabContents"
      ]);

      // Map tabContents to array of DocViewers in Persistent Routes
      // Note: Deletion of a tab may cause rerender
      const docViewers = tabContents.map(tabContent => {

        if (!tabContent.url || tabContent.url === "/") {
          return null;
        }

        return (
          <PersistentRoute exact path={tabContent.url}>
            <RepositoryDocViewerScreen persistenceLayerProvider={app.persistenceLayerProvider} url={tabContent.url} />
          </PersistentRoute>
        );
        }
      ).filter(value => value !== null);

      (window as any).docViewers = docViewers;
      if (docViewers.length === 0) {
        return null;
      }


      return (
        <>
          {docViewers}
        </>
      );

    }

    const RenderDocRepoScreen = React.memo(() => (
        <AuthRequired>
            <PersistenceLayerApp tagsType="documents"
                                 repoDocMetaManager={repoDocMetaManager}
                                 repoDocMetaLoader={repoDocMetaLoader}
                                 persistenceLayerManager={persistenceLayerManager}
                                 render={(docRepo) =>
                                     <DocRepoStore2>
                                         <DocRepoSidebarTagStore>
                                             <>
                                                 <AnkiSyncController/>
                                                 <DocRepoScreen2/>
                                             </>
                                         </DocRepoSidebarTagStore>
                                     </DocRepoStore2>
                                 }/>
        </AuthRequired>
    ));

    const RenderAnnotationRepoScreen = React.memo(() => {
        return (
            <AuthRequired>
                <PersistenceLayerApp tagsType="annotations"
                                     repoDocMetaManager={repoDocMetaManager}
                                     repoDocMetaLoader={repoDocMetaLoader}
                                     persistenceLayerManager={persistenceLayerManager}
                                     render={(props) =>
                                         <AnnotationRepoStore2>
                                             <AnnotationRepoSidebarTagStore>
                                                 <>
                                                     <ReviewRouter/>
                                                     <AnnotationRepoScreen2/>
                                                 </>
                                             </AnnotationRepoSidebarTagStore>
                                         </AnnotationRepoStore2>
                                     }/>
            </AuthRequired>
        );
    });

    const LogoutScreen = React.memo(() => {
        return (
            <AuthRequired>
                <PersistenceLayerApp tagsType="annotations"
                                     repoDocMetaManager={repoDocMetaManager}
                                     repoDocMetaLoader={repoDocMetaLoader}
                                     persistenceLayerManager={persistenceLayerManager}
                                     render={(props) =>
                                         <LogoutDialog/>
                                     }/>
            </AuthRequired>
        );
    });

    const RenderSettingsScreen = () => (
        <Cached>
            <PersistenceLayerContext.Provider value={{persistenceLayerProvider: app.persistenceLayerProvider}}>
                <SettingsScreen/>
            </PersistenceLayerContext.Provider>
        </Cached>
    );

    // const renderProfileScreen = () => (
    //     <Cached>
    //         <ProfileScreen
    //             persistenceLayerProvider={app.persistenceLayerProvider}
    //             persistenceLayerController={app.persistenceLayerController}/>
    //     </Cached>
    // );

    const renderDeviceScreen = () => (
        <Cached>
            <DeviceScreen/>
        </Cached>
    );

    const RenderDefaultScreen = React.memo(() => (
        <RenderDocRepoScreen/>
    ));

    const renderWhatsNewScreen = () => (
        <WhatsNewScreen/>
    );

    // const renderCommunityScreen = () => (
    //     <AuthRequired authStatus={authStatus}>
    //         <CommunityScreen persistenceLayerProvider={persistenceLayerProvider}
    //                          persistenceLayerController={persistenceLayerController}/>
    //     </AuthRequired>
    // );

    const renderStatsScreen = () => (
        <AuthRequired>
            <PersistenceLayerApp tagsType="documents"
                                 repoDocMetaManager={repoDocMetaManager}
                                 repoDocMetaLoader={repoDocMetaLoader}
                                 persistenceLayerManager={persistenceLayerManager}
                                 render={(docRepo) =>
                                     <StatsScreen/>
                                 }/>
        </AuthRequired>
    );

    // const renderLogsScreen = () => {
    //     return (
    //         <AuthRequired authStatus={app.authStatus}>
    //             <LogsScreen
    //                 persistenceLayerProvider={app.persistenceLayerProvider}
    //                 persistenceLayerController={app.persistenceLayerController}/>
    //         </AuthRequired>
    //     );
    // };

    // const editorsPicksScreen = () => {
    //     return (
    //         <AuthRequired authStatus={authStatus}>
    //             <EditorsPicksScreen persistenceLayerProvider={persistenceLayerProvider}
    //                                 persistenceLayerController={persistenceLayerController}/>
    //         </AuthRequired>
    //         );
    // };
    //
    // const renderCreateGroupScreen = () => {
    //
    //     return (
    //         <AuthRequired authStatus={app.authStatus}>
    //             <CreateGroupScreen
    //                 persistenceLayerProvider={app.persistenceLayerProvider}
    //                 persistenceLayerController={app.persistenceLayerController}
    //                 repoDocMetaManager={repoDocMetaManager}/>
    //         </AuthRequired>
    //     );
    // };

    const premiumScreen = () => {
        return (
            <PremiumScreen/>
        );
    };

    const premiumScreenYear = () => {
        return (
            <PremiumScreen interval='year'/>
        );
    };

    const supportScreen = () => {
        return (<SupportScreen/>);
    };

    // const renderGroupScreen = () => {
    //     return (
    //         <GroupScreen persistenceLayerProvider={app.persistenceLayerProvider}
    //                      persistenceLayerController={app.persistenceLayerController}/>);
    // };

    // const renderGroupsScreen = () => {
    //     return (<GroupsScreen
    //                 persistenceLayerProvider={app.persistenceLayerProvider}
    //                 persistenceLayerController={app.persistenceLayerController}/>);
    // };
    //
    // const renderGroupHighlightsScreen = () => {
    //     return (<HighlightsScreen
    //                 persistenceLayerProvider={app.persistenceLayerProvider}
    //                 persistenceLayerController={app.persistenceLayerController}/>);
    // };

    // const renderGroupHighlightScreen = () => {
    //     return (<GroupHighlightScreen
    //                 persistenceLayerProvider={app.persistenceLayerProvider}
    //                 persistenceLayerController={app.persistenceLayerController}/>);
    // };

    const renderInvite = () => {
        return <InviteScreen/>;
    };

    return (
        <MUIRepositoryRoot>
            <RepositoryRoot>
                <div className="RepositoryApp"
                     style={{
                         display: 'flex',
                         minHeight: 0,
                         flexDirection: 'column',
                         flexGrow: 1
                     }}>

                    <>
                        <UseLocationChangeStoreProvider>
                            <BrowserRouter>
                              <BrowserTabs />
                                <UseLocationChangeRoot>
                                    <MUIDialogController>

                                        <Switch>
                                            <RepositoryDocViewers />
                                            {/*<></>*/}

                                            <Route exact path={["/login", "/login.html"]}>
                                                <LoginScreen/>
                                            </Route>

                                            {/*<Route exact path={["/doc", "/doc/:id"]}>*/}
                                            {/*    <RenderDocViewerScreen/>*/}
                                            {/*</Route>*/}

                                            <Route exact path="/error">
                                                <ErrorScreen/>
                                            </Route>

                                            <Route exact path='/logout'>
                                                <LogoutScreen/>
                                            </Route>

                                            <Route>
                                                <RepoHeader3/>

                                                <PersistentRoute exact path="/">
                                                    <RenderDefaultScreen/>
                                                </PersistentRoute>

                                                <PersistentRoute exact path="/annotations">
                                                    <RenderAnnotationRepoScreen/>
                                                </PersistentRoute>

                                                <Switch location={ReactRouters.createLocationWithPathOnly()}>

                                                    <Route exact path='/whats-new'
                                                           render={renderWhatsNewScreen}/>

                                                    <Route exact path='/invite' render={renderInvite}/>

                                                    <Route exact path='/plans' render={premiumScreen}/>

                                                    <Route exact path='/plans-year'
                                                           render={premiumScreenYear}/>

                                                    <Route exact path='/premium' render={premiumScreen}/>

                                                    <Route exact path='/support' render={supportScreen}/>

                                                    <Route exact path='/stats'
                                                           component={renderStatsScreen}/>

                                                    <Route exact path="/settings"
                                                           component={RenderSettingsScreen}/>

                                                    <Route exact path="/device"
                                                           component={renderDeviceScreen}/>

                                                </Switch>
                                                <RepoFooter/>
                                            </Route>

                                        </Switch>

                                        <Switch location={ReactRouters.createLocationWithHashOnly()}>

                                            <Route path='#account'
                                                   component={() =>
                                                       <Cached>
                                                           <AccountControlSidebar persistenceLayerController={app.persistenceLayerController}/>
                                                       </Cached>
                                                   }/>

                                            <Route path='#add'>
                                                <AuthRequired>
                                                    <PersistenceLayerContext.Provider value={{persistenceLayerProvider: app.persistenceLayerProvider}}>
                                                        <AddFileDropzoneScreen/>
                                                    </PersistenceLayerContext.Provider>
                                                </AuthRequired>
                                            </Route>

                                        </Switch>
                                    </MUIDialogController>
                                </UseLocationChangeRoot>
                            </BrowserRouter>
                        </UseLocationChangeStoreProvider>
                    </>

                </div>
            </RepositoryRoot>
        </MUIRepositoryRoot>
    );

};

