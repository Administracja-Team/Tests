import { mount } from '@vue/test-utils';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SetRoleDialog from '../views/SetRoleDialog.vue';
import { nextTick } from 'vue';

// --- Мокаем компоненты PrimeVue ---
vi.mock('primevue/dialog', () => ({
  default: {
    template: '<div><slot></slot></div>',
    props: ['visible']
  }
}));

vi.mock('primevue/button', () => ({
  default: {
    template: '<button @click="$emit(\'click\')"><slot /></button>',
    props: ['icon', 'label', 'class']
  }
}));

vi.mock('primevue/dropdown', () => ({
  default: {
    template: '<select @change="$emit(\'update:modelValue\', $event.target.value)"></select>',
    props: ['modelValue', 'options', 'optionLabel', 'optionValue', 'placeholder']
  }
}));

vi.mock('primevue/inputtext', () => ({
  default: {
    template: '<input @input="$emit(\'update:modelValue\', $event.target.value)" />',
    props: ['modelValue', 'placeholder']
  }
}));

// --- Мокаем toast ---
const addMock = vi.fn();
vi.mock('primevue/usetoast', () => ({
  useToast: () => ({
    add: addMock
  })
}));

// --- Мокаем API (внутри фабрики) ---
let setSystemRoleMock;
let setDescriptiveRoleMock;
vi.mock('../services/api', () => {
  setSystemRoleMock = vi.fn(() => Promise.resolve());
  setDescriptiveRoleMock = vi.fn(() => Promise.resolve());

  return {
    setSystemRole: setSystemRoleMock,
    setDescriptiveRole: setDescriptiveRoleMock
  };
});

describe('SetRoleDialog.vue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mountComponent = (props = {}) =>
    mount(SetRoleDialog, {
      props: {
        show: true,
        memberId: 123,
        memberName: 'John Doe',
        initialSystemRole: 'MEMBER',
        initialDescriptiveRole: 'Frontend Dev',
        ...props
      }
    });

  it('рендерит диалог и отображает начальные значения', () => {
    const wrapper = mountComponent();
    expect(wrapper.text()).toContain('Set role');
    expect(wrapper.text()).toContain('System role');
    expect(wrapper.text()).toContain('Descriptive role');
  });

  it('показывает сообщение об ошибке, если memberId некорректен', async () => {
    const wrapper = mountComponent({ memberId: 0 });
    const button = wrapper.find('button:last-of-type'); // Кнопка "Set"
    await button.trigger('click');
    expect(addMock).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Invalid member ID'
      })
    );
    expect(setSystemRoleMock).not.toHaveBeenCalled();
  });

  it('вызывает API и эмитит событие при установке ролей', async () => {
    const wrapper = mountComponent();
    const button = wrapper.find('button:last-of-type');
    await button.trigger('click');
    await nextTick();

    expect(setSystemRoleMock).toHaveBeenCalledWith(123, 'MEMBER');
    expect(setDescriptiveRoleMock).toHaveBeenCalledWith(123, 'Frontend Dev');
    expect(wrapper.emitted('roles-updated')).toBeTruthy();
    expect(wrapper.emitted('roles-updated')[0][0]).toEqual({
      memberId: 123,
      systemRole: 'MEMBER',
      descriptiveRole: 'Frontend Dev'
    });
  });

  it('закрывает диалог при клике на кнопку закрытия', async () => {
    const wrapper = mountComponent();
    const closeButton = wrapper.find('button'); // Первая кнопка — это "arrow-left"
    await closeButton.trigger('click');
    expect(wrapper.emitted('update:show')).toBeTruthy();
    expect(wrapper.emitted('update:show')[0]).toEqual([false]);
  });

  it('показывает toast при 403 ошибке', async () => {
    setSystemRoleMock.mockRejectedValueOnce({ response: { status: 403 } });
    const wrapper = mountComponent();
    const button = wrapper.find('button:last-of-type');
    await button.trigger('click');
    await nextTick();
    expect(addMock).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'You do not have permission to update roles'
      })
    );
  });

  it('показывает toast при 404 ошибке', async () => {
    setSystemRoleMock.mockRejectedValueOnce({ response: { status: 404 } });
    const wrapper = mountComponent();
    const button = wrapper.find('button:last-of-type');
    await button.trigger('click');
    await nextTick();
    expect(addMock).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Member not found'
      })
    );
  });

  it('показывает toast при 500 ошибке', async () => {
    setSystemRoleMock.mockRejectedValueOnce({ response: { status: 500 } });
    const wrapper = mountComponent();
    const button = wrapper.find('button:last-of-type');
    await button.trigger('click');
    await nextTick();
    expect(addMock).toHaveBeenCalledWith(
      expect.objectContaining({
        detail: 'Server error, please try again later'
      })
    );
  });
});
