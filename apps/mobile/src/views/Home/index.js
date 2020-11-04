import React, {useCallback, useEffect} from 'react';
import {ContainerBottomButton} from '../../components/Container/ContainerBottomButton';
import {Placeholder} from '../../components/ListPlaceholders';
import SimpleList from '../../components/SimpleList';
import {NoteItemWrapper} from '../../components/SimpleList/NoteItemWrapper';
import {useTracked} from '../../provider';
import {Actions} from '../../provider/Actions';
import {DDS} from '../../services/DeviceDetection';
import {eSendEvent} from '../../services/EventManager';
import {scrollRef} from '../../utils';
import {openEditorAnimation} from '../../utils/Animations';
import {
  eOnLoadNote,
  eScrollEvent,
  eUpdateSearchState,
} from '../../utils/Events';

export const Home = ({navigation}) => {
  const [state, dispatch] = useTracked();
  const {notes} = state;

  const onFocus = useCallback(() => {
    dispatch({
      type: Actions.HEADER_TEXT_STATE,
      state: {
        heading: 'Home',
      },
    });
    dispatch({
      type: Actions.CURRENT_SCREEN,
      screen: 'home',
    });
    dispatch({
      type: Actions.HEADER_STATE,
      state: true,
    });
    updateSearch();

    eSendEvent(eScrollEvent, 0);
    dispatch({type: Actions.COLORS});
    dispatch({type: Actions.NOTES});
  }, [notes]);

  const onBlur = useCallback(() => {}, []);

  useEffect(() => {
    navigation.addListener('focus', onFocus);
    navigation.addListener('blur', onBlur);
    return () => {
      navigation.removeListener('focus', onFocus);
      navigation.removeListener('blur', onBlur);
    };
  });

  useEffect(() => {
    if (navigation.isFocused()) {
      updateSearch();
    }
  }, [notes]);

  const updateSearch = () => {
    if (notes.length === 0) {
      eSendEvent('showSearch', true);
    } else {
      eSendEvent(eUpdateSearchState, {
        placeholder: 'Search all notes',
        data: notes,
        noSearch: false,
        type: 'notes',
        color: null,
      });
    }
  };

  const _onPressBottomButton = async (event) => {
    eSendEvent(eOnLoadNote, {type: 'new'});

    if (DDS.isPhone || DDS.isSmallTab) {
      openEditorAnimation();
    }
  };

  return (
    <>
      <SimpleList
        data={notes}
        scrollRef={scrollRef}
        type="notes"
        isHome={true}
        pinned={true}
        sortMenuButton={true}
        focused={() => navigation.isFocused()}
        RenderItem={NoteItemWrapper}
        placeholder={<Placeholder type="notes" />}
        placeholderText={`Notes you write appear here`}
        jumpToDialog={true}
      />

      <ContainerBottomButton
        title="Create a new note"
        onPress={_onPressBottomButton}
      />
    </>
  );
};

export default Home;
